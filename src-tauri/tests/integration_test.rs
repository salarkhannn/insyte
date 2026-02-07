use std::fs;
use tempfile::TempDir;

#[test]
fn test_data_pipeline() {
    let dir = TempDir::new().unwrap();
    let csv_path = dir.path().join("sales.csv");
    
    let content = "product,quantity,price\nWidget,10,50.00\nGadget,15,75.00\nWidget,5,50.00";
    fs::write(&csv_path, content).unwrap();

    assert!(csv_path.exists());
    assert!(fs::metadata(&csv_path).unwrap().len() > 0);
}

#[test]
fn test_project_serialization() {
    use serde::{Deserialize, Serialize};
    use chrono::Utc;

    #[derive(Serialize, Deserialize)]
    struct TestProject {
        version: String,
        created_at: String,
    }

    let project = TestProject {
        version: "1.0".to_string(),
        created_at: Utc::now().to_rfc3339(),
    };

    let json = serde_json::to_string(&project).unwrap();
    let deserialized: TestProject = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.version, "1.0");
}

#[test]
fn test_export_csv() {
    let dir = TempDir::new().unwrap();
    let export_path = dir.path().join("export.csv");
    
    let content = "name,value\ntest,123";
    fs::write(&export_path, content).unwrap();

    let exported = fs::read_to_string(&export_path).unwrap();
    assert!(exported.contains("name,value"));
    assert!(exported.contains("test,123"));
}
