mod mysqlcmd;
mod pgcmd;

use mysqlcmd::DbConnection;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(DbConnection::new())
        .manage(pgcmd::DbConnection::new())
        .invoke_handler(tauri::generate_handler![
            mysqlcmd::connect_to_mysql,
            mysqlcmd::show_databases,
            mysqlcmd::select_database,
            mysqlcmd::execute_query,
            pgcmd::connect_to_postgres,
            pgcmd::pg_show_databases,
            pgcmd::pg_select_database,
            pgcmd::pg_execute_query,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
