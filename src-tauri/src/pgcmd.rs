use postgres::types::Type;
use postgres::{Client, NoTls};
use serde::{Deserialize, Serialize};
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
pub struct DatabaseObjects {
    tables: Vec<String>,
    procedures: Vec<String>,
    views: Vec<String>,
    functions: Vec<String>,
}

pub struct DbConnection {
    client: Mutex<Option<Client>>,
    connection_string: Mutex<Option<String>>,
    selected_db: Mutex<Option<String>>,
}

impl DbConnection {
    pub fn new() -> Self {
        DbConnection {
            client: Mutex::new(None),
            connection_string: Mutex::new(None),
            selected_db: Mutex::new(None),
        }
    }

    fn get_client(&self) -> Result<std::sync::MutexGuard<Option<Client>>, String> {
        self.client.lock().map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub fn connect_to_postgres(
    connection_string: ConnectionString,
    state: State<'_, DbConnection>,
) -> Result<String, String> {
    let client = Client::connect(&connection_string.value, NoTls).map_err(|e| e.to_string())?;

    let mut current_client = state.client.lock().map_err(|e| e.to_string())?;
    *current_client = Some(client);

    let mut current_conn_string = state.connection_string.lock().map_err(|e| e.to_string())?;
    *current_conn_string = Some(connection_string.value);

    Ok("Connected successfully".to_string())
}

#[tauri::command]
pub fn pg_show_databases(state: State<'_, DbConnection>) -> Result<Vec<String>, String> {
    let mut client = state.get_client()?;
    let client = client.as_mut().ok_or("Database not connected")?;

    let rows = client
        .query(
            "SELECT datname FROM pg_database WHERE datistemplate = false",
            &[],
        )
        .map_err(|e| e.to_string())?;

    let databases = rows.iter().map(|row| row.get(0)).collect();

    Ok(databases)
}

#[tauri::command]
pub fn pg_select_database(
    databasename: DatabaseName,
    state: State<'_, DbConnection>,
) -> Result<DatabaseObjects, String> {
    let mut conn_string_lock = state.connection_string.lock().map_err(|e| e.to_string())?;
    let conn_string = conn_string_lock
        .as_mut()
        .ok_or("No connection string available")?;

    println!("{}", conn_string);

    // Update the connection string with the new database name
    let new_conn_string = if conn_string.matches('/').count() == 3 {
        // If the connection string already has a path (which might be a database name),
        // replace everything after the last slash
        let parts: Vec<&str> = conn_string.rsplitn(3, '/').collect();
        format!("{}/{}", parts[1], databasename.name)
    } else {
        // If there's no path, simply append the database name
        format!("{}/{}", conn_string, databasename.name)
    };

    println!("New connection string: {}", new_conn_string);

    // Create a new client with the updated connection string
    let new_client = Client::connect(&new_conn_string, NoTls).map_err(|e| e.to_string())?;

    // Update the client
    let mut client_lock = state.client.lock().map_err(|e| e.to_string())?;
    *client_lock = Some(new_client);

    // Update the connection string
    *conn_string = new_conn_string;

    // Update the selected database
    let mut selected_db = state.selected_db.lock().map_err(|e| e.to_string())?;
    *selected_db = Some(databasename.name.clone());

    // Get database objects using the new client
    let client = client_lock.as_mut().unwrap();

    // Get all tables
    let tables: Vec<String> = client
        .query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
            &[],
        )
        .map_err(|e| e.to_string())?
        .iter()
        .map(|row| row.get(0))
        .collect();

    // Get all procedures
    let procedures: Vec<String> = client
        .query(
            "SELECT routine_name FROM information_schema.routines WHERE routine_type = 'PROCEDURE' AND routine_schema = 'public'",
            &[],
        )
        .map_err(|e| e.to_string())?
        .iter()
        .map(|row| row.get(0))
        .collect();

    // Get all views
    let views: Vec<String> = client
        .query(
            "SELECT table_name FROM information_schema.views WHERE table_schema = 'public'",
            &[],
        )
        .map_err(|e| e.to_string())?
        .iter()
        .map(|row| row.get(0))
        .collect();

    // Get all functions
    let functions: Vec<String> = client
        .query(
            "SELECT routine_name FROM information_schema.routines WHERE routine_type = 'FUNCTION' AND routine_schema = 'public'",
            &[],
        )
        .map_err(|e| e.to_string())?
        .iter()
        .map(|row| row.get(0))
        .collect();

    Ok(DatabaseObjects {
        tables,
        procedures,
        views,
        functions,
    })
}

#[tauri::command]
pub fn pg_execute_query(query: String, state: State<'_, DbConnection>) -> Result<String, String> {
    let mut client = state.get_client()?;
    let client = client.as_mut().ok_or("Database not connected")?;

    let selected_db = state.selected_db.lock().map_err(|e| e.to_string())?;
    if selected_db.is_none() {
        return Err("No database selected. Please select a database first.".to_string());
    }

    let query_type = query.trim().to_uppercase();

    if query_type.starts_with(&"SELECT column_name, data_type, character_maximum_length, is_nullable FROM information_schema.columns".to_uppercase()) {
        let rows = client.query(&query, &[]).map_err(|e| e.to_string())?;

        if rows.is_empty() {
            return Ok("No columns found for the specified table.".to_string());
        }

        let mut output = String::from("Column Name | Data Type | Max Length | Nullable\n");
        output.push_str("-----------|-----------|------------|----------\n");

        for row in rows {
            let column_name: &str = row.get(0);
            let data_type: &str = row.get(1);
            let max_length: Option<i32> = row.get(2);
            let is_nullable: &str = row.get(3);

            output.push_str(&format!(
                "{:<11}|{:<11}|{:<12}|{:<10}\n",
                column_name,
                data_type,
                max_length.map_or("NULL".to_string(), |v| v.to_string()),
                is_nullable
            ));
        }

        Ok(output)
    } else if query_type.starts_with("SELECT") || query_type.starts_with("SHOW") {
        let rows = client.query(&query, &[]).map_err(|e| e.to_string())?;

        if rows.is_empty() {
            return Ok("Query executed successfully. No rows returned.".to_string());
        }

        let mut output = String::new();

        for row in &rows {
            for (i, column) in row.columns().iter().enumerate() {
                if i > 0 {
                    output.push('\t');
                }
                output.push_str(column.name());
                output.push_str(": ");
                output.push_str(&value_to_string(row, i));
            }
            output.push('\n');
        }

        Ok(output)
    } else {
        let result = client.execute(&query, &[]);

        match result {
            Ok(affected_rows) => Ok(format!("Query executed successfully. Rows affected: {}", affected_rows)),
            Err(e) => Err(format!("Query execution error: {}", e)),
        }
    }
}

fn value_to_string(row: &postgres::Row, index: usize) -> String {
    let column = &row.columns()[index];
    match column.type_() {
        &Type::BOOL => row
            .get::<_, Option<bool>>(index)
            .map_or("NULL".to_string(), |v| v.to_string()),
        &Type::INT2 | &Type::INT4 | &Type::INT8 => row
            .get::<_, Option<i64>>(index)
            .map_or("NULL".to_string(), |v| v.to_string()),
        &Type::FLOAT4 | &Type::FLOAT8 => row
            .get::<_, Option<f64>>(index)
            .map_or("NULL".to_string(), |v| v.to_string()),
        &Type::TEXT | &Type::VARCHAR => row
            .get::<_, Option<String>>(index)
            .map_or("NULL".to_string(), |v| v),
        _ => "Unsupported type".to_string(),
    }
}
