#[cfg(test)]
mod tests {
    use super::super::*;
    use polars::prelude::*;
    use std::fs;
    use tempfile::TempDir;

    fn create_test_csv() -> (TempDir, String) {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("test.csv");
        let content = "name,age,salary\nAlice,30,75000\nBob,25,65000\nCarol,35,85000";
        fs::write(&path, content).unwrap();
        (dir, path.to_str().unwrap().to_string())
    }

    fn create_test_json() -> (TempDir, String) {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("test.json");
        let content = r#"[
            {"name": "Alice", "age": 30, "salary": 75000},
            {"name": "Bob", "age": 25, "salary": 65000}
        ]"#;
        fs::write(&path, content).unwrap();
        (dir, path.to_str().unwrap().to_string())
    }

    #[test]
    fn test_csv_parsing() {
        let (_dir, path) = create_test_csv();
        let df = CsvReadOptions::default()
            .try_into_reader_with_file_path(Some(path.into()))
            .unwrap()
            .finish()
            .unwrap();

        assert_eq!(df.height(), 3);
        assert_eq!(df.width(), 3);
        assert!(df.get_column_names().iter().any(|s| s.as_str() == "name"));
        assert!(df.get_column_names().iter().any(|s| s.as_str() == "age"));
        assert!(df.get_column_names().iter().any(|s| s.as_str() == "salary"));
    }

    #[test]
    fn test_json_parsing() {
        let (_dir, path) = create_test_json();
        let file = fs::File::open(path).unwrap();
        let df = JsonReader::new(file).finish().unwrap();

        assert_eq!(df.height(), 2);
        assert_eq!(df.width(), 3);
    }

    #[test]
    fn test_column_type_detection() {
        let (_dir, path) = create_test_csv();
        let df = CsvReadOptions::default()
            .try_into_reader_with_file_path(Some(path.into()))
            .unwrap()
            .finish()
            .unwrap();

        let age_col = df.column("age").unwrap();
        let salary_col = df.column("salary").unwrap();

        assert!(matches!(age_col.dtype(), DataType::Int64));
        assert!(matches!(salary_col.dtype(), DataType::Int64));
    }

    #[test]
    fn test_empty_csv_error() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("empty.csv");
        fs::write(&path, "").unwrap();

        let result = CsvReadOptions::default()
            .try_into_reader_with_file_path(Some(path.to_str().unwrap().into()))
            .unwrap()
            .finish();

        assert!(result.is_err());
    }

    #[test]
    fn test_invalid_csv_path() {
        let result = CsvReadOptions::default()
            .try_into_reader_with_file_path(Some("/nonexistent/path.csv".into()))
            .and_then(|reader| reader.finish());

        assert!(result.is_err());
    }
}
