use polars::prelude::*;
use std::sync::Mutex;

pub struct DataState {
    current_df: Option<DataFrame>,
    file_path: Option<String>,
}

impl DataState {
    pub fn new() -> Self {
        Self {
            current_df: None,
            file_path: None,
        }
    }

    pub fn set_dataframe(&mut self, df: DataFrame, path: String) {
        self.current_df = Some(df);
        self.file_path = Some(path);
    }

    pub fn get_dataframe(&self) -> Option<&DataFrame> {
        self.current_df.as_ref()
    }

    pub fn get_file_path(&self) -> Option<&String> {
        self.file_path.as_ref()
    }

    pub fn clear(&mut self) {
        self.current_df = None;
        self.file_path = None;
    }

    pub fn has_data(&self) -> bool {
        self.current_df.is_some()
    }
}

impl Default for DataState {
    fn default() -> Self {
        Self::new()
    }
}

pub type AppDataState = Mutex<DataState>;
