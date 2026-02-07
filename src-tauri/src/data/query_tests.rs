#[cfg(test)]
mod tests {
    use polars::prelude::*;

    fn create_test_dataframe() -> DataFrame {
        let categories = Series::new("category".into(), &["A", "B", "A", "C", "B", "A"]);
        let values = Series::new("value".into(), &[10, 20, 15, 30, 25, 12]);
        let dates = Series::new(
            "date".into(),
            &["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05", "2024-01-06"],
        );

        DataFrame::new(vec![categories, values, dates]).unwrap()
    }

    #[test]
    fn test_sum_aggregation() {
        let df = create_test_dataframe();
        let result = df
            .clone()
            .lazy()
            .group_by([col("category")])
            .agg([col("value").sum()])
            .collect()
            .unwrap();

        assert_eq!(result.height(), 3);

        let value_col = result.column("value").unwrap();
        let sum: i32 = value_col.sum().unwrap();
        assert_eq!(sum, 112);
    }

    #[test]
    fn test_mean_aggregation() {
        let df = create_test_dataframe();
        let result = df
            .clone()
            .lazy()
            .group_by([col("category")])
            .agg([col("value").mean()])
            .collect()
            .unwrap();

        assert_eq!(result.height(), 3);
    }

    #[test]
    fn test_count_aggregation() {
        let df = create_test_dataframe();
        let result = df
            .clone()
            .lazy()
            .group_by([col("category")])
            .agg([col("value").count()])
            .collect()
            .unwrap();

        let filtered = result
            .clone()
            .lazy()
            .filter(col("category").eq(lit("A")))
            .collect()
            .unwrap();
        let category_a_count = filtered
            .column("value")
            .unwrap()
            .get(0)
            .unwrap();

        assert_eq!(category_a_count.try_extract::<usize>().unwrap(), 3);
    }

    #[test]
    fn test_filter_operations() {
        let df = create_test_dataframe();
        let result = df
            .clone()
            .lazy()
            .filter(col("value").gt(lit(15)))
            .collect()
            .unwrap();

        assert_eq!(result.height(), 3);
    }

    #[test]
    fn test_sort_operations() {
        let df = create_test_dataframe();
        let result = df
            .clone()
            .sort(["value"], SortMultipleOptions::default().with_order_descending(true))
            .unwrap();

        let first_value = result
            .column("value")
            .unwrap()
            .get(0)
            .unwrap()
            .try_extract::<i32>()
            .unwrap();

        assert_eq!(first_value, 30);
    }

    #[test]
    fn test_multiple_filters() {
        let df = create_test_dataframe();
        let result = df
            .clone()
            .lazy()
            .filter(col("value").gt(lit(10)).and(col("category").eq(lit("A"))))
            .collect()
            .unwrap();

        assert_eq!(result.height(), 2);
    }

    #[test]
    fn test_min_max_aggregation() {
        let df = create_test_dataframe();
        let min_val = df.column("value").unwrap().min::<i32>().unwrap();
        let max_val = df.column("value").unwrap().max::<i32>().unwrap();

        assert_eq!(min_val, Some(10));
        assert_eq!(max_val, Some(30));
    }
}
