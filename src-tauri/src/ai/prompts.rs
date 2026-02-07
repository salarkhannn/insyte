use crate::data::types::ColumnInfo;

pub fn build_visualization_prompt(
    user_query: &str,
    columns: &[ColumnInfo],
    row_count: usize,
) -> String {
    let schema_description = columns
        .iter()
        .map(|col| {
            format!(
                "  - {} ({}{})",
                col.name,
                col.dtype,
                if col.nullable { ", nullable" } else { "" }
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    format!(
        r#"You are a data visualization assistant. Given a dataset schema and a user question, output a JSON specification for a chart.

DATASET SCHEMA:
Total rows: {}
Columns:
{}

USER QUESTION: {}

CHART TYPE SELECTION RULES:
- "bar": Use for comparing categories, rankings, distributions. Example: "sales by region", "top 10 products"
- "line": Use for trends over time, continuous data. Example: "revenue trend", "monthly growth"
- "area": Use for cumulative totals, filled time series. Example: "cumulative sales", "stacked revenue over time"
- "pie": Use for proportions of a whole, percentages. Example: "market share", "budget breakdown", "distribution by category"
- "scatter": Use for correlations, relationships between two numeric variables. Example: "price vs quantity", "age vs income"

IMPORTANT: Match the chart type to the user's intent:
- If user asks for "pie chart" or "proportion" or "percentage" or "breakdown" → use "pie"
- If user asks for "scatter plot" or "correlation" or "relationship between X and Y" → use "scatter"
- If user asks for "area chart" or "cumulative" or "filled" → use "area"
- If user asks for "line chart" or "trend" or "over time" → use "line"
- If user asks for "bar chart" or "comparison" or "ranking" → use "bar"

RULES:
1. Output ONLY valid JSON, no explanation or markdown
2. Use exact column names from schema
3. Choose the chart type that best matches the user's request
4. Always use a valid aggregation: sum, avg, count, min, max, or median
5. If the query is ambiguous, make reasonable assumptions
6. NEVER use "none" or "None" for aggregation - always choose count as default

OUTPUT FORMAT (use exact lowercase values):
{{
  "chartType": "bar|line|area|pie|scatter",
  "xField": "column_name",
  "yField": "column_name",
  "aggregation": "sum|avg|count|min|max|median",
  "groupBy": null,
  "sortBy": "x|y|none",
  "sortOrder": "asc|desc|none",
  "title": "Chart Title",
  "filters": []
}}

IMPORTANT: The "aggregation" field must be one of: sum, avg, count, min, max, median (lowercase only)"#,
        row_count, schema_description, user_query
    )
}

pub fn build_chat_prompt(
    user_query: &str,
    columns: &[ColumnInfo],
    row_count: usize,
    sample_rows: &[Vec<String>],
) -> String {
    let schema_description = columns
        .iter()
        .map(|col| format!("  - {} ({})", col.name, col.dtype))
        .collect::<Vec<_>>()
        .join("\n");

    let sample_data = if sample_rows.is_empty() {
        String::from("No sample data available.")
    } else {
        let headers = columns.iter().map(|c| c.name.as_str()).collect::<Vec<_>>().join(" | ");
        let rows = sample_rows
            .iter()
            .map(|row| row.join(" | "))
            .collect::<Vec<_>>()
            .join("\n");
        format!("{}\n{}", headers, rows)
    };

    format!(
        r#"You are a data analysis assistant. Analyze the user's request and respond appropriately.

DATASET:
- Total rows: {}
- Columns:
{}

SAMPLE DATA (first {} rows):
{}

USER REQUEST: {}

TASK:
1. Determine if the user wants a VISUALIZATION or has a DATA QUESTION.
2. For visualizations: provide chart specification and a brief explanation of what the chart shows.
3. For data questions: provide a direct answer based on the schema and sample data.

RESPONSE FORMAT (output ONLY valid JSON, no markdown):

For VISUALIZATION requests (show, chart, plot, compare, trend, etc.):
{{
  "intent": "visualization",
  "spec": {{
    "chartType": "bar|line|area|pie|scatter",
    "xField": "column_name",
    "yField": "column_name",
    "aggregation": "sum|avg|count|min|max|median",
    "groupBy": null,
    "sortBy": "x|y|none",
    "sortOrder": "asc|desc|none",
    "title": "Chart Title",
    "filters": []
  }},
  "explanation": "Brief explanation of what this chart displays and why this visualization is appropriate."
}}

IMPORTANT: The "aggregation" field MUST be one of: sum, avg, count, min, max, median (lowercase only). NEVER use "none" or "None".

For DATA QUESTIONS (what, how many, total, average, list, etc.):
{{
  "intent": "question",
  "answer": "Direct answer to the question.",
  "insights": [
    {{"label": "Metric name", "value": "value"}},
    {{"label": "Another metric", "value": "value"}}
  ]
}}

RULES:
- Use exact column names from the schema
- For questions about totals, counts, or aggregations, provide your best estimate based on sample data
- Keep explanations concise (1-2 sentences)
- Insights are optional; include only if there are relevant supporting metrics
- For aggregation, choose: sum for totals, avg for averages, count for frequencies, min/max for ranges, median for central tendency
- NEVER use "none" or "None" for aggregation field"#,
        row_count,
        schema_description,
        sample_rows.len(),
        sample_data,
        user_query
    )
}
