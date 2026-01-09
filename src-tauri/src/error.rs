use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error, Serialize)]
pub enum DataError {
    #[error("File not found: {0}")]
    FileNotFound(String),

    #[error("Unsupported file format: {0}")]
    UnsupportedFormat(String),

    #[error("Failed to read file: {0}")]
    ReadError(String),

    #[error("Failed to parse data: {0}")]
    ParseError(String),

    #[error("No data available")]
    NoData,

    #[error("Invalid sheet: {0}")]
    InvalidSheet(String),
}

impl From<std::io::Error> for DataError {
    fn from(err: std::io::Error) -> Self {
        DataError::ReadError(err.to_string())
    }
}

impl From<polars::prelude::PolarsError> for DataError {
    fn from(err: polars::prelude::PolarsError) -> Self {
        DataError::ParseError(err.to_string())
    }
}

impl From<calamine::Error> for DataError {
    fn from(err: calamine::Error) -> Self {
        DataError::ReadError(err.to_string())
    }
}

impl From<calamine::XlsxError> for DataError {
    fn from(err: calamine::XlsxError) -> Self {
        DataError::ReadError(err.to_string())
    }
}
