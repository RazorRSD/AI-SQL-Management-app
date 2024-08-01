use std::fs;
use std::os::windows::process::CommandExt;
use std::path::Path;
use std::process::Child;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::async_runtime;

fn find_python() -> Option<String> {
    let output = Command::new("where").arg("python").output().ok()?;
    if output.status.success() {
        String::from_utf8(output.stdout)
            .ok()?
            .lines()
            .next()
            .map(str::to_string)
    } else {
        None
    }
}

fn parse_python_version(version_string: &str) -> Option<(u32, u32, u32)> {
    let parts: Vec<&str> = version_string
        .split_whitespace()
        .nth(1)?
        .split('.')
        .collect();
    if parts.len() >= 3 {
        Some((
            parts[0].parse().ok()?,
            parts[1].parse().ok()?,
            parts[2].parse().ok()?,
        ))
    } else {
        None
    }
}

const CREATE_NO_WINDOW: u32 = 0x08000000;

#[tauri::command]
pub fn check_python_installation() -> Result<String, String> {
    let python_path = find_python().ok_or_else(|| "Python not found in PATH".to_string())?;

    let output = Command::new(python_path)
        .args(&["--version"])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        let version_string = String::from_utf8_lossy(&output.stdout);
        if let Some((major, minor, _)) = parse_python_version(&version_string) {
            if major == 3 && minor == 10 {
                Ok(format!(
                    "Python 3.10.* is installed. ({})",
                    version_string.trim()
                ))
            } else {
                Err(format!(
                    "Python 3.10.* is not installed. Found: {}",
                    version_string.trim()
                ))
            }
        } else {
            Err(format!(
                "Failed to parse Python version: {}",
                version_string.trim()
            ))
        }
    } else {
        Err("Failed to check Python version.".to_string())
    }
}

#[tauri::command]
pub async fn install_python() -> Result<String, String> {
    println!("Starting Python 3.10.11 installation using winget...");

    let installation_result = async_runtime::spawn(async move {
        let output = Command::new("winget")
            .args(&[
                "install",
                "--id",
                "9PJPW5LDXLZ5",
                "--source",
                "msstore",
                "--silent",
                "--accept-package-agreements",
                "--accept-source-agreements",
            ])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map_err(|e| e.to_string())?;

        if output.status.success() {
            Ok("Python 3.10.11 installation process completed.".to_string())
        } else {
            let error_message = String::from_utf8_lossy(&output.stderr);
            Err(format!(
                "Failed to install Python 3.10.11: {}",
                error_message
            ))
        }
    })
    .await;

    match installation_result {
        Ok(result) => result,
        Err(e) => Err(format!("Error during installation: {}", e)),
    }
}

#[tauri::command]
pub async fn get_installation_status() -> Result<String, String> {
    let output = Command::new("where")
        .arg("python")
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        let python_path = String::from_utf8_lossy(&output.stdout);
        if python_path.contains("Python310") {
            Ok("Python 3.10 is installed and in PATH.".to_string())
        } else {
            Ok("Python is installed, but version 3.10 is not in PATH. A system restart may be required.".to_string())
        }
    } else {
        Ok(
            "Python 3.10 installation not detected in PATH. A system restart may be required."
                .to_string(),
        )
    }
}

#[tauri::command]
pub async fn manage_venv() -> Result<String, String> {
    let venv_name = "sqlmantauri";
    let home_dir = std::env::var("USERPROFILE").map_err(|e| e.to_string())?;
    let venv_path = Path::new(&home_dir).join(venv_name);

    println!("Creating virtual environment '{}'...", venv_path.display());

    if venv_path.exists() {
        Ok(format!(
            "Virtual environment '{}' already exists.",
            venv_name
        ))
    } else {
        // Create the virtual environment
        let output = Command::new("python")
            .args(&["-m", "venv", venv_path.to_str().unwrap()])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            return Err(format!(
                "Failed to create virtual environment: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        // Activate the virtual environment and install any required packages
        let activate_script = venv_path.join("Scripts").join("activate.bat");
        let output = Command::new("cmd")
            .args(&[
                "/C",
                activate_script.to_str().unwrap(),
                "&&",
                "pip",
                "install",
                "torch",
                "torchvision",
                "torchaudio",
                "--index-url",
                "https://download.pytorch.org/whl/cu124",
                "&&",
                "pip",
                "install",
                "aiohttp==3.10.0",
                "aiofiles==24.1.0",
                "huggingface_hub==0.24.3",
                "ctransformers==0.2.27",
                "psutil==5.9.6",
                "fastapi==0.111.1",
                "uvicorn==0.30.3",
                "pydantic==2.8.2",
                "numpy==1.26.4",
            ])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            return Err(format!(
                "Failed to install required packages: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        Ok(format!(
            "Virtual environment '{}' created successfully and packages installed.",
            venv_name
        ))
    }
}

#[tauri::command]
pub fn activate_venv() -> Result<String, String> {
    let venv_name = "sqlmantauri";
    let home_dir = std::env::var("USERPROFILE").map_err(|e| e.to_string())?;
    let venv_path = Path::new(&home_dir).join(venv_name);
    let activate_script = venv_path.join("Scripts").join("activate");

    if !activate_script.exists() {
        return Err(format!(
            "Virtual environment '{}' not found or not properly set up.",
            venv_name
        ));
    }

    // Set environment variables to activate the virtual environment
    std::env::set_var("VIRTUAL_ENV", venv_path.to_str().unwrap());

    let new_path = format!(
        "{}{}{}",
        venv_path.join("Scripts").to_str().unwrap(),
        std::path::MAIN_SEPARATOR,
        std::env::var("PATH").unwrap()
    );
    std::env::set_var("PATH", new_path);

    // Remove PYTHONHOME if it's set
    std::env::remove_var("PYTHONHOME");

    Ok(format!("Virtual environment '{}' activated.", venv_name))
}

struct PythonProcess {
    child: Child,
}

lazy_static::lazy_static! {
    static ref PYTHON_PROCESS: Arc<Mutex<Option<PythonProcess>>> = Arc::new(Mutex::new(None));
}

#[tauri::command]
pub fn start_python_script() -> Result<String, String> {
    let mut process = PYTHON_PROCESS.lock().map_err(|e| e.to_string())?;
    if process.is_some() {
        return Err("Python process is already running".to_string());
    }

    let home_dir = std::env::var("USERPROFILE").map_err(|e| e.to_string())?;
    let venv_path = Path::new(&home_dir).join("sqlmantauri");
    let python_executable = venv_path.join("Scripts").join("python.exe");

    let current_exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let app_dir = current_exe.parent().ok_or("Failed to get app directory")?;
    let script_path = app_dir.join("scripts").join("main.py");

    let child = Command::new(python_executable)
        .arg(script_path)
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .map_err(|e| format!("Failed to start Python process: {}", e))?;

    *process = Some(PythonProcess { child });
    Ok("FastAPI SQLCoder service started successfully".to_string())
}

#[tauri::command]
pub fn stop_python_script() -> Result<String, String> {
    let mut process = PYTHON_PROCESS.lock().map_err(|e| e.to_string())?;
    if let Some(mut p) = process.take() {
        // On Windows, we need to kill the process tree
        let output = Command::new("taskkill")
            .args(&["/F", "/T", "/PID", &p.child.id().to_string()])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map_err(|e| format!("Failed to kill Python process: {}", e))?;

        if !output.status.success() {
            return Err(format!(
                "Failed to kill Python process: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        // Wait a bit to ensure the process is fully terminated
        thread::sleep(Duration::from_secs(2));

        // Check if the process has actually terminated
        match p.child.try_wait() {
            Ok(Some(_)) => Ok("FastAPI SQLCoder service stopped successfully".to_string()),
            Ok(None) => {
                // Force kill if it's still running
                p.child
                    .kill()
                    .map_err(|e| format!("Failed to force kill Python process: {}", e))?;
                Ok("FastAPI SQLCoder service forcefully terminated".to_string())
            }
            Err(e) => Err(format!("Error checking Python process status: {}", e)),
        }
    } else {
        Err("No Python process is running".to_string())
    }
}

#[tauri::command]
pub fn delete_venv() -> Result<String, String> {
    let venv_name = "sqlmantauri";
    let home_dir = std::env::var("USERPROFILE").map_err(|e| e.to_string())?;
    let venv_path = Path::new(&home_dir).join(venv_name);

    if venv_path.exists() {
        // Attempt to remove the directory
        fs::remove_dir_all(&venv_path)
            .map_err(|e| format!("Failed to delete virtual environment: {}", e))?;
        Ok(format!(
            "Virtual environment '{}' deleted successfully.",
            venv_name
        ))
    } else {
        Ok(format!(
            "Virtual environment '{}' does not exist.",
            venv_name
        ))
    }
}

#[tauri::command]
pub fn update_venv_requirements() -> Result<String, String> {
    let venv_name = "sqlmantauri";
    let home_dir = std::env::var("USERPROFILE").map_err(|e| e.to_string())?;
    let venv_path = Path::new(&home_dir).join(venv_name);
    let activate_script = venv_path.join("Scripts").join("activate.bat");

    if !venv_path.exists() {
        return Err(format!(
            "Virtual environment '{}' does not exist. Please create it first.",
            venv_name
        ));
    }

    // Activate the virtual environment and update packages
    let output = Command::new("cmd")
        .args(&[
            "/C",
            activate_script.to_str().unwrap(),
            "&&",
            "pip",
            "install",
            "torch",
            "torchvision",
            "torchaudio",
            "--index-url",
            "https://download.pytorch.org/whl/cu124",
            "&&",
            "pip",
            "install",
            "aiohttp==3.10.0",
            "aiofiles==24.1.0",
            "huggingface_hub==0.24.3",
            "ctransformers==0.2.27",
            "psutil==5.9.6",
            "fastapi==0.111.1",
            "uvicorn==0.30.3",
            "pydantic==2.8.2",
            "numpy==1.26.4",
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| format!("Failed to update packages: {}", e))?;

    if output.status.success() {
        Ok(format!(
            "Successfully updated packages in virtual environment '{}'.",
            venv_name
        ))
    } else {
        Err(format!(
            "Failed to update packages: {}",
            String::from_utf8_lossy(&output.stderr)
        ))
    }
}
