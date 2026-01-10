use crate::data::types::ColumnInfo;

pub fn build_visualization_prompt(user_query: &str, columns: &[ColumnInfo], row_count: usize) -> String {
    let schema_description = columns
        .iter()
        .map(|col| format!("  - {} ({}{})", col.name, col.dtype, if col.nullable { ", nullable" } else { "" }))
        .collect::<Vec<_>>()
        .join("\n");

    format!(
        r#"You are a data visualization assistant. Given a dataset schema and a user question, output a JSON specification for a chart.

DATASET SCHEMA:
Total rows: {}
Columns:
{}

USER QUESTION: {}

RULES:
1. Output ONLY valid JSON, no explanation or markdown
2. Use exact column names from schema
3. Choose appropriate chart type: bar, line, area, pie, scatter
4. Include aggregation when needed: sum, avg, count, min, max
5. For time series, use line or area charts
6. For comparisons, use bar charts
7. For proportions, use pie charts
8. For correlations, use scatter charts
9. If the query is ambiguous, make reasonable assumptions

OUTPUT FORMAT:
{{
  "chart_type": "bar|line|area|pie|scatter",
  "x_field": "column_name",
  "y_field": "column_name",
  "aggregation": "sum|avg|count|min|max",
  "group_by": "column_name_or_null",
  "sort_by": "x|y|none",
  "sort_order": "asc|desc",
  "title": "Chart Title",
  "filters": []
}}"#,
        row_count,
        schema_description,
        user_query
    )
}
