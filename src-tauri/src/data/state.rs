use polars::prelude::*;
use std::collections::HashMap;
use std::sync::Mutex;

pub struct DataState {
    pub tables: HashMap<String, DataFrame>,
    pub table_order: Vec<String>,
    pub active_table: Option<String>,
    pub file_path: Option<String>,
}

impl DataState {
    pub fn new() -> Self {
        Self {
            tables: HashMap::new(),
            table_order: Vec::new(),
            active_table: None,
            file_path: None,
        }
    }

    pub fn add_dataframe(&mut self, name: String, df: DataFrame) {
        if !self.tables.contains_key(&name) {
            self.table_order.push(name.clone());
        }
        self.tables.insert(name, df);
    }

    pub fn set_active_table(&mut self, name: String) -> Result<(), String> {
        if self.tables.contains_key(&name) {
            self.active_table = Some(name);
            Ok(())
        } else {
            Err(format!("Table '{}' not found", name))
        }
    }

    pub fn get_active_dataframe(&self) -> Option<&DataFrame> {
        self.active_table.as_ref().and_then(|name| self.tables.get(name))
    }

    pub fn get_dataframe(&self, name: &str) -> Option<&DataFrame> {
        self.tables.get(name)
    }

    pub fn get_tables(&self) -> Vec<String> {
        self.table_order.clone()
    }

    pub fn set_file_path(&mut self, path: String) {
        self.file_path = Some(path);
    }

    pub fn get_file_path(&self) -> Option<&String> {
        self.file_path.as_ref()
    }

    pub fn clear(&mut self) {
        self.tables.clear();
        self.table_order.clear();
        self.active_table = None;
        self.file_path = None;
    }

    pub fn has_data(&self) -> bool {
        !self.tables.is_empty()
    }
}

impl Default for DataState {
    fn default() -> Self {
        Self::new()
    }
}

pub type AppDataState = Mutex<DataState>;
