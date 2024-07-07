use mysql::prelude::*;
use mysql::*;
use serde::Deserialize;
use serde::Serialize;
use std::sync::Mutex;
use tauri::State;

#[derive(Serialize, Deserialize)]
pub struct ConnectionString {
    pub value: String,
}

#[derive(Serialize, Deserialize)]
pub struct DatabaseName {
    pub name: String,
}

#[derive(Serialize, Deserialize)]
pub struct QueryString {
    pub query: String,
}

#[derive(Serialize)]
struct RowData {
    id: i32,
    name: String,
    value: f64,
}

#[derive(Serialize)]
pub struct QueryResult {
    results: Vec<RowData>,
}

#[derive(Serialize)]
pub struct DatabaseObjects {
    tables: Vec<String>,
    procedures: Vec<String>,
    views: Vec<String>,
    functions: Vec<String>,
}

pub struct DbConnection {
    pool: Mutex<Option<Pool>>,
    selected_db: Mutex<Option<String>>,
}

impl DbConnection {
    pub fn new() -> Self {
        DbConnection {
            pool: Mutex::new(None),
            selected_db: Mutex::new(None),
        }
    }

    fn get_conn(&self) -> Result<PooledConn, String> {
        let pool = self.pool.lock().map_err(|e| e.to_string())?;
        match &*pool {
            Some(p) => p.get_conn().map_err(|e| e.to_string()),
            None => Err("Database not connected".to_string()),
        }
    }
}

#[tauri::command]
pub fn connect_to_mysql(
    connection_string: ConnectionString,
    state: State<'_, DbConnection>,
) -> Result<String, String> {
    let opts = Opts::from_url(&connection_string.value).map_err(|e| e.to_string())?;
    let pool = Pool::new(opts).map_err(|e| e.to_string())?;

    let mut current_pool = state.pool.lock().map_err(|e| e.to_string())?;
    *current_pool = Some(pool);

    Ok("Connected successfully".to_string())
}

#[tauri::command]
pub fn show_databases(state: State<'_, DbConnection>) -> Result<Vec<String>, String> {
    let mut conn = state.get_conn()?;
    let databases: Vec<String> = conn
        .query_map("SHOW DATABASES", |database: String| database)
        .map_err(|e| e.to_string())?;

    Ok(databases)
}

#[tauri::command]
pub fn select_database(
    db_name: DatabaseName,
    state: State<'_, DbConnection>,
) -> Result<DatabaseObjects, String> {
    let mut conn = state.get_conn()?;
    
    // Select the database
    conn.query_drop(format!("USE {}", db_name.name))
        .map_err(|e| e.to_string())?;
    
    // Update the selected database
    let mut selected_db = state.selected_db.lock().map_err(|e| e.to_string())?;
    *selected_db = Some(db_name.name.clone());
    
    // Get all tables
    let tables: Vec<String> = conn
        .query_map("SHOW TABLES", |table: String| table)
        .map_err(|e| e.to_string())?;
    
    // Get all stored procedures
    let procedures: Vec<String> = conn
        .query_map(
            format!("SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_TYPE = 'PROCEDURE' AND ROUTINE_SCHEMA = '{}'", db_name.name),
            |procedure: String| procedure
        )
        .map_err(|e| e.to_string())?;
    
    // Get all views
    let views: Vec<String> = conn
        .query_map(
            format!("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA = '{}'", db_name.name),
            |view: String| view
        )
        .map_err(|e| e.to_string())?;
    
    // Get all functions
    let functions: Vec<String> = conn
        .query_map(
            format!("SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_TYPE = 'FUNCTION' AND ROUTINE_SCHEMA = '{}'", db_name.name),
            |function: String| function
        )
        .map_err(|e| e.to_string())?;

    Ok(DatabaseObjects {
        tables,
        procedures,
        views,
        functions,
    })
}


#[tauri::command]
pub fn execute_query(
    query: String,
    state: State<'_, DbConnection>,
) -> Result<String, String> {
    // Lock the mutex to access the shared DbConnection
    let mut conn = state.get_conn()?;

    // Select the database
    let selected_db = state.selected_db.lock().map_err(|e| e.to_string())?;
    
    // Check if a database is selected
    if let Some(db) = &*selected_db {
        // Select the database
        conn.query_drop(format!("USE {}", db))
            .map_err(|e| e.to_string())?;
    } else {
        return Err("No database selected. Please select a database first.".to_string());
    }


    let query_type = query.trim().to_uppercase();
    
    if query_type.starts_with("SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS") {
            // Special handling for table structure query
        let result: Vec<Row> =  conn
        .query_iter(&query)
        .map_err(|e| format!("Query execution error: {}", e))?
        .flat_map(|result| result)
        .collect();
        
        if result.is_empty() {
            return Ok("No columns found for the specified table.".to_string());
        }
        
        let mut output = String::from("Column Name | Data Type | Max Length | Nullable\n");
        output.push_str("-----------|-----------|------------|----------\n");
        
        for row in result {
            let column_name = value_to_string(&row[0]);
            let data_type = value_to_string(&row[1]);
            let max_length = value_to_string(&row[2]);
            let is_nullable = value_to_string(&row[3]);
            
            output.push_str(&format!("{:<11}|{:<11}|{:<12}|{:<10}\n", 
                column_name, data_type, max_length, is_nullable));
        }
        
        Ok(output)

    } else if query_type.starts_with("SELECT") || query_type.starts_with("SHOW") {

        let result: Vec<Row> = conn
            .query_iter(&query)
            .map_err(|e| format!("Query execution error: {}", e))?
            .flat_map(|result| result)
            .collect();

        let mut output = String::new();

        if result.is_empty() {
            return Ok("Query executed successfully. No rows returned.".to_string());
        }

        for row in result {
            for (i, column) in row.columns_ref().iter().enumerate() {
                if i>0 {
                    output.push('\t');
                }
                output.push_str(&column.name_str());
                output.push_str(": ");
                output.push_str(&value_to_string(&row[i]));
            }
            output.push('\n');
        }

        Ok(output)

    } else {
        let _result = conn.query_drop(query);

        if let Err(e) = _result {
            return Err(format!("Query execution error: {}", e));
        }

        Ok(format!("Query executed successfully. Rows affected: {}", conn.affected_rows()))
    }
}


fn value_to_string(value: &mysql::Value) -> String {
    match value {
        mysql::Value::NULL => "NULL".to_string(),
        mysql::Value::Bytes(b) => String::from_utf8_lossy(b).into_owned(),
        mysql::Value::Int(i) => i.to_string(),
        mysql::Value::UInt(u) => u.to_string(),
        mysql::Value::Float(f) => f.to_string(),
        mysql::Value::Double(d) => d.to_string(),
        mysql::Value::Date(y, m, d, h, i, s, us) => 
            format!("{:04}-{:02}-{:02} {:02}:{:02}:{:02}.{:06}", y, m, d, h, i, s, us),
        mysql::Value::Time(neg, d, h, i, s, us) => 
            format!("{}{} days {:02}:{:02}:{:02}.{:06}", if *neg { "-" } else { "" }, d, h, i, s, us),
    }
}