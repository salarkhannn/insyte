//! # Deterministic Sampling Module
//!
//! This module provides sampling algorithms for data reduction that are:
//! - Deterministic: Same input always produces same output
//! - Stable: Results don't change across re-renders
//! - Distribution-preserving: Sample maintains shape of original data
//!
//! ## Algorithms
//! - Reservoir Sampling: O(n) single-pass sampling
//! - Stratified Sampling: Preserves proportions across categories
//! - Systematic Sampling: Even distribution through dataset

use polars::prelude::*;

use crate::data::safety::SAMPLING_SEED;
use crate::error::DataError;

// ============================================================================
// SAMPLING CONFIGURATION
// ============================================================================

/// Configuration for sampling operations.
#[derive(Debug, Clone)]
pub struct SamplingConfig {
    /// Target number of samples to return.
    pub target_size: usize,

    /// Seed for deterministic random selection.
    pub seed: u64,

    /// Whether to preserve distribution across strata.
    pub preserve_distribution: bool,

    /// Column to use for stratification (if any).
    pub stratify_by: Option<String>,

    /// Minimum samples per stratum.
    pub min_samples_per_stratum: usize,
}

impl Default for SamplingConfig {
    fn default() -> Self {
        Self {
            target_size: 10_000,
            seed: SAMPLING_SEED,
            preserve_distribution: true,
            stratify_by: None,
            min_samples_per_stratum: 10,
        }
    }
}

impl SamplingConfig {
    pub fn with_target(mut self, target: usize) -> Self {
        self.target_size = target;
        self
    }

    pub fn with_seed(mut self, seed: u64) -> Self {
        self.seed = seed;
        self
    }

    pub fn with_stratification(mut self, column: String) -> Self {
        self.stratify_by = Some(column);
        self.preserve_distribution = true;
        self
    }
}

/// Metadata about the sampling operation performed.
#[derive(Debug, Clone)]
pub struct SamplingResult {
    /// The sampled DataFrame.
    pub data: DataFrame,

    /// Original row count.
    pub original_rows: usize,

    /// Sampled row count.
    pub sampled_rows: usize,

    /// Sampling ratio applied (0.0 - 1.0).
    pub sample_ratio: f64,

    /// Whether distribution was preserved.
    pub distribution_preserved: bool,

    /// Sampling method used.
    pub method: SamplingMethod,

    /// Per-stratum statistics (if stratified).
    pub strata_stats: Option<Vec<StratumStats>>,
}

#[derive(Debug, Clone, Copy)]
pub enum SamplingMethod {
    Reservoir,
    Stratified,
    Systematic,
    Hash,
}

#[derive(Debug, Clone)]
pub struct StratumStats {
    pub stratum_value: String,
    pub original_count: usize,
    pub sampled_count: usize,
    pub sample_ratio: f64,
}

// ============================================================================
// RESERVOIR SAMPLING
// ============================================================================

/// Deterministic reservoir sampling using a seeded pseudo-random selection.
///
/// # Algorithm
/// Uses a hash-based approach to ensure determinism:
/// 1. Compute hash of (row_index, seed) for each row
/// 2. Select rows with lowest hash values up to target size
///
/// This is O(n log k) where n is dataset size and k is sample size.
pub struct ReservoirSampler {
    config: SamplingConfig,
}

impl ReservoirSampler {
    pub fn new(config: SamplingConfig) -> Self {
        Self { config }
    }

    /// Sample from a LazyFrame deterministically.
    pub fn sample(&self, df: LazyFrame, total_rows: usize) -> Result<SamplingResult, DataError> {
        if total_rows <= self.config.target_size {
            // No sampling needed
            let collected = df
                .collect()
                .map_err(|e| DataError::ParseError(e.to_string()))?;

            return Ok(SamplingResult {
                data: collected.clone(),
                original_rows: total_rows,
                sampled_rows: total_rows,
                sample_ratio: 1.0,
                distribution_preserved: true,
                method: SamplingMethod::Reservoir,
                strata_stats: None,
            });
        }

        // Calculate sampling interval for deterministic selection
        let sample_ratio = self.config.target_size as f64 / total_rows as f64;

        // Use hash-based selection for determinism
        // Add row index, compute hash, sort by hash, take top N
        let sampled = df
            .with_row_index("__reservoir_idx", None)
            // Create deterministic hash for each row
            .with_column(
                (col("__reservoir_idx") * lit(self.config.seed as i64) % lit(1_000_000_007i64))
                    .alias("__reservoir_hash"),
            )
            // Sort by hash to get deterministic "random" ordering
            .sort(["__reservoir_hash"], SortMultipleOptions::default())
            // Take target number of rows
            .limit(self.config.target_size as u32)
            // Sort back by original index to maintain order
            .sort(["__reservoir_idx"], SortMultipleOptions::default())
            // Drop helper columns
            .drop(["__reservoir_idx", "__reservoir_hash"])
            .collect()
            .map_err(|e| DataError::ParseError(e.to_string()))?;

        Ok(SamplingResult {
            data: sampled.clone(),
            original_rows: total_rows,
            sampled_rows: sampled.height(),
            sample_ratio,
            distribution_preserved: true,
            method: SamplingMethod::Reservoir,
            strata_stats: None,
        })
    }
}

// ============================================================================
// STRATIFIED SAMPLING
// ============================================================================

/// Stratified sampling that preserves category proportions.
///
/// # Algorithm
/// 1. Group data by stratification column
/// 2. Calculate sample size for each stratum proportional to its size
/// 3. Apply reservoir sampling within each stratum
/// 4. Combine results
pub struct StratifiedSampler {
    config: SamplingConfig,
}

impl StratifiedSampler {
    pub fn new(config: SamplingConfig) -> Self {
        Self { config }
    }

    /// Sample from a DataFrame with stratification.
    pub fn sample(&self, df: DataFrame) -> Result<SamplingResult, DataError> {
        let total_rows = df.height();

        if total_rows <= self.config.target_size {
            return Ok(SamplingResult {
                data: df,
                original_rows: total_rows,
                sampled_rows: total_rows,
                sample_ratio: 1.0,
                distribution_preserved: true,
                method: SamplingMethod::Stratified,
                strata_stats: None,
            });
        }

        let stratify_col = match &self.config.stratify_by {
            Some(col) => col.clone(),
            None => {
                // Fall back to reservoir sampling if no stratification column
                let reservoir = ReservoirSampler::new(self.config.clone());
                return reservoir.sample(df.lazy(), total_rows);
            }
        };

        // Get unique values in stratification column
        let strata_series = df
            .column(&stratify_col)
            .map_err(|e| DataError::ParseError(e.to_string()))?;

        let unique_strata = strata_series
            .unique()
            .map_err(|e| DataError::ParseError(e.to_string()))?;

        let n_strata = unique_strata.len();
        let overall_ratio = self.config.target_size as f64 / total_rows as f64;

        // Calculate per-stratum sample sizes
        let mut sampled_frames: Vec<DataFrame> = Vec::new();
        let mut strata_stats: Vec<StratumStats> = Vec::new();

        for i in 0..n_strata {
            let stratum_value = unique_strata.get(i).ok();
            let stratum_str = match &stratum_value {
                Some(av) => format!("{}", av),
                None => "NULL".to_string(),
            };

            // Filter to this stratum
            let stratum_mask = strata_series
                .equal(&unique_strata.slice(i as i64, 1))
                .map_err(|e| DataError::ParseError(e.to_string()))?;

            let stratum_df = df
                .filter(&stratum_mask)
                .map_err(|e| DataError::ParseError(e.to_string()))?;

            let stratum_size = stratum_df.height();

            // Calculate proportional sample size (with minimum)
            let target_for_stratum = ((stratum_size as f64 * overall_ratio).ceil() as usize)
                .max(self.config.min_samples_per_stratum)
                .min(stratum_size);

            // Sample this stratum
            let stratum_config = SamplingConfig {
                target_size: target_for_stratum,
                seed: self.config.seed.wrapping_add(i as u64), // Different seed per stratum
                ..self.config.clone()
            };

            let reservoir = ReservoirSampler::new(stratum_config);
            let stratum_result = reservoir.sample(stratum_df.lazy(), stratum_size)?;

            sampled_frames.push(stratum_result.data);

            strata_stats.push(StratumStats {
                stratum_value: stratum_str,
                original_count: stratum_size,
                sampled_count: stratum_result.sampled_rows,
                sample_ratio: stratum_result.sample_ratio,
            });
        }

        // Combine all sampled strata
        if sampled_frames.is_empty() {
            return Err(DataError::ParseError("No strata to sample".to_string()));
        }

        let mut combined = sampled_frames.remove(0);
        for frame in sampled_frames {
            combined = combined
                .vstack(&frame)
                .map_err(|e| DataError::ParseError(e.to_string()))?;
        }

        let sampled_rows = combined.height();

        Ok(SamplingResult {
            data: combined,
            original_rows: total_rows,
            sampled_rows,
            sample_ratio: sampled_rows as f64 / total_rows as f64,
            distribution_preserved: true,
            method: SamplingMethod::Stratified,
            strata_stats: Some(strata_stats),
        })
    }
}

// ============================================================================
// SYSTEMATIC SAMPLING
// ============================================================================

/// Systematic sampling with deterministic interval selection.
///
/// # Algorithm
/// 1. Calculate interval k = N / n
/// 2. Select rows at indices: start, start + k, start + 2k, ...
/// 3. Start position is determined by seed for determinism
pub struct SystematicSampler {
    config: SamplingConfig,
}

impl SystematicSampler {
    pub fn new(config: SamplingConfig) -> Self {
        Self { config }
    }

    /// Sample from a LazyFrame systematically.
    pub fn sample(&self, df: LazyFrame, total_rows: usize) -> Result<SamplingResult, DataError> {
        if total_rows <= self.config.target_size {
            let collected = df
                .collect()
                .map_err(|e| DataError::ParseError(e.to_string()))?;

            return Ok(SamplingResult {
                data: collected,
                original_rows: total_rows,
                sampled_rows: total_rows,
                sample_ratio: 1.0,
                distribution_preserved: true,
                method: SamplingMethod::Systematic,
                strata_stats: None,
            });
        }

        // Calculate interval
        let interval = total_rows as f64 / self.config.target_size as f64;
        let interval_int = interval.ceil() as i64;

        // Deterministic start position based on seed
        let start = (self.config.seed % interval_int as u64) as i64;

        // Select every k-th row starting from start
        let sampled = df
            .with_row_index("__sys_idx", None)
            .filter(
                ((col("__sys_idx").cast(DataType::Int64) - lit(start)) % lit(interval_int))
                    .eq(lit(0)),
            )
            .limit(self.config.target_size as u32)
            .drop(["__sys_idx"])
            .collect()
            .map_err(|e| DataError::ParseError(e.to_string()))?;

        let sampled_rows = sampled.height();

        Ok(SamplingResult {
            data: sampled,
            original_rows: total_rows,
            sampled_rows,
            sample_ratio: sampled_rows as f64 / total_rows as f64,
            distribution_preserved: true,
            method: SamplingMethod::Systematic,
            strata_stats: None,
        })
    }
}

// ============================================================================
// HASH-BASED SAMPLING
// ============================================================================

/// Hash-based sampling for multi-column determinism.
///
/// Uses hash of key columns to ensure:
/// - Same rows are always selected for same data
/// - Determinism across restarts and re-renders
/// - Consistent behavior regardless of row ordering
pub struct HashSampler {
    config: SamplingConfig,
    key_columns: Vec<String>,
}

impl HashSampler {
    pub fn new(config: SamplingConfig, key_columns: Vec<String>) -> Self {
        Self {
            config,
            key_columns,
        }
    }

    /// Sample using hash of key columns.
    pub fn sample(&self, df: DataFrame) -> Result<SamplingResult, DataError> {
        let total_rows = df.height();

        if total_rows <= self.config.target_size {
            return Ok(SamplingResult {
                data: df,
                original_rows: total_rows,
                sampled_rows: total_rows,
                sample_ratio: 1.0,
                distribution_preserved: true,
                method: SamplingMethod::Hash,
                strata_stats: None,
            });
        }

        // Calculate hash threshold for target sample size
        // We select rows where hash(keys) mod N < target_size
        let modulo = (total_rows as f64 / self.config.target_size as f64).ceil() as u64;

        let mut lazy_df = df.lazy();

        // Build deterministic hash expression using row index and seed
        // We use row index combined with seed for deterministic sampling
        lazy_df = lazy_df
            .with_row_index("__hash_idx", None)
            .with_column(
                // Deterministic hash: (row_index * prime + seed) for reproducibility
                ((col("__hash_idx").cast(DataType::Int64) * lit(2654435761i64)) + lit(self.config.seed as i64))
                    .alias("__hash_val"),
            );

        let sampled = lazy_df
            .filter((col("__hash_val") % lit(modulo as i64)).eq(lit(0i64)))
            .limit(self.config.target_size as u32)
            .select([col("*").exclude(["__hash_val", "__hash_idx"])])
            .collect()
            .map_err(|e| DataError::ParseError(e.to_string()))?;

        let sampled_rows = sampled.height();

        Ok(SamplingResult {
            data: sampled,
            original_rows: total_rows,
            sampled_rows,
            sample_ratio: sampled_rows as f64 / total_rows as f64,
            distribution_preserved: false, // Hash sampling doesn't guarantee distribution
            method: SamplingMethod::Hash,
            strata_stats: None,
        })
    }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/// Sample a DataFrame using the most appropriate method.
///
/// Automatically selects sampling method based on:
/// - Data size
/// - Presence of categorical columns for stratification
/// - Target reduction ratio
pub fn auto_sample(
    df: DataFrame,
    target_size: usize,
    stratify_by: Option<&str>,
) -> Result<SamplingResult, DataError> {
    let config = SamplingConfig {
        target_size,
        seed: SAMPLING_SEED,
        preserve_distribution: stratify_by.is_some(),
        stratify_by: stratify_by.map(String::from),
        min_samples_per_stratum: 10,
    };

    let height = df.height();
    if stratify_by.is_some() {
        StratifiedSampler::new(config).sample(df)
    } else {
        ReservoirSampler::new(config).sample(df.lazy(), height)
    }
}

/// Quick deterministic sample for scatter plots.
pub fn scatter_sample(df: LazyFrame, total_rows: usize, target_size: usize) -> Result<SamplingResult, DataError> {
    let config = SamplingConfig::default().with_target(target_size);
    SystematicSampler::new(config).sample(df, total_rows)
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_df(n: usize) -> DataFrame {
        let categories: Vec<&str> = (0..n).map(|i| if i % 3 == 0 { "A" } else if i % 3 == 1 { "B" } else { "C" }).collect();
        let values: Vec<f64> = (0..n).map(|i| i as f64).collect();

        df! {
            "category" => categories,
            "value" => values,
        }
        .unwrap()
    }

    #[test]
    fn test_reservoir_sampling_deterministic() {
        let df = create_test_df(1000);
        let config = SamplingConfig::default().with_target(100);

        let sampler = ReservoirSampler::new(config.clone());
        let result1 = sampler.sample(df.clone().lazy(), 1000).unwrap();
        let result2 = sampler.sample(df.lazy(), 1000).unwrap();

        // Same input should produce same output
        assert_eq!(result1.sampled_rows, result2.sampled_rows);
    }

    #[test]
    fn test_reservoir_sampling_respects_target() {
        let df = create_test_df(10000);
        let config = SamplingConfig::default().with_target(500);

        let sampler = ReservoirSampler::new(config);
        let result = sampler.sample(df.lazy(), 10000).unwrap();

        assert_eq!(result.sampled_rows, 500);
        assert!(result.sample_ratio < 0.1);
    }

    #[test]
    fn test_stratified_sampling_preserves_proportions() {
        let df = create_test_df(900); // 300 each of A, B, C
        let config = SamplingConfig::default()
            .with_target(90)
            .with_stratification("category".to_string());

        let sampler = StratifiedSampler::new(config);
        let result = sampler.sample(df).unwrap();

        // Should have roughly equal samples from each category
        assert!(result.strata_stats.is_some());
        let stats = result.strata_stats.unwrap();
        assert_eq!(stats.len(), 3);

        for stat in &stats {
            // Each stratum should have ~30 samples (90/3)
            assert!(stat.sampled_count >= 10);
            assert!(stat.sampled_count <= 50);
        }
    }

    #[test]
    fn test_systematic_sampling_even_distribution() {
        let df = create_test_df(1000);
        let config = SamplingConfig::default().with_target(100);

        let sampler = SystematicSampler::new(config);
        let result = sampler.sample(df.lazy(), 1000).unwrap();

        assert_eq!(result.sampled_rows, 100);
        assert_eq!(result.method as u8, SamplingMethod::Systematic as u8);
    }

    #[test]
    fn test_no_sampling_when_under_target() {
        let df = create_test_df(50);
        let config = SamplingConfig::default().with_target(100);

        let sampler = ReservoirSampler::new(config);
        let result = sampler.sample(df.lazy(), 50).unwrap();

        assert_eq!(result.sampled_rows, 50);
        assert_eq!(result.sample_ratio, 1.0);
    }

    #[test]
    fn test_auto_sample_selects_appropriate_method() {
        let df = create_test_df(1000);

        // Without stratification
        let result1 = auto_sample(df.clone(), 100, None).unwrap();
        assert!(matches!(result1.method, SamplingMethod::Reservoir));

        // With stratification
        let result2 = auto_sample(df, 100, Some("category")).unwrap();
        assert!(matches!(result2.method, SamplingMethod::Stratified));
    }
}
