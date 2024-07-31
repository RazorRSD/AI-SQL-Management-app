import os
import psutil  # type: ignore
import threading
from sys import platform

if os.name == "nt": 
    process_name = "sql_manager.exe"
elif platform.startswith("linux"):
    process_name = "sql_manager"
else:
    process_name = "sql_manager"


def get_process_id(process_name):
    for proc in psutil.process_iter(attrs=["pid", "name"]):
        try:
            if process_name == proc.info["name"]:
                return proc.info["pid"]
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess) as e:
            print(e)
    return False


def set_interval(func, sec):
    def func_wrapper():
        set_interval(func, sec)
        func()

    t = threading.Timer(sec, func_wrapper)
    t.start()
    return t


parent_pid = os.getpid()


def check():
    if get_process_id(process_name) == False:
        print("exiting")
        psutil.Process(parent_pid).kill()


set_interval(check, 10)