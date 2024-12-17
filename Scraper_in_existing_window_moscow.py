import os
import shutil
import time
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as ec
import csv
from selenium.common.exceptions import TimeoutException


def fill_out_form(driver, strings):
    paste_strings_to_textarea(driver, strings)
    url_input = WebDriverWait(driver, 10).until(ec.presence_of_element_located((By.NAME, "url")))
    url_input.clear()
    url_input.send_keys("http://renokom.ru/")
    check_checkbox(driver)


def delete_files_in_directory(directory):
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        try:
            if os.path.isfile(file_path):
                os.unlink(file_path)
        except Exception as e:
            print(f"Failed to delete {file_path}. Reason: {e}")


def setup_driver():
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument("--remote-debugging-port=9222")
    chrome_options.add_argument("--user-data-dir=E:\\WORK\\Python\\SeoScraper\\chromeCache")
    chrome_options.add_experimental_option("prefs", {
        "download.default_directory": "E:\\WORK\\Python\\SeoScraper\\files",
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "safebrowsing.enabled": True
    })
    driver = webdriver.Chrome(options=chrome_options)
    return driver


def read_csv_file(filename):
    with open(filename, 'r', encoding='utf-8') as file:
        reader = csv.reader(file)
        return [row[0] for row in reader]


def paste_strings_to_textarea(driver, strings):
    textarea = WebDriverWait(driver, 10).until(ec.presence_of_element_located((By.NAME, "queries")))
    textarea.clear()
    textarea.send_keys("\n".join(strings))



def check_checkbox(driver):
    checkbox = WebDriverWait(driver, 10).until(ec.presence_of_element_located((By.ID, "google-checkbox")))
    if not checkbox.is_selected():
        checkbox.click()

"""
def check_checkbox(driver):
    google_checkbox = WebDriverWait(driver, 10).until(ec.presence_of_element_located((By.ID, "google-checkbox")))
    yandex_checkbox = WebDriverWait(driver, 10).until(
        ec.presence_of_element_located((By.CLASS_NAME, "yandex-checkbox")))

    if not google_checkbox.is_selected():
        google_checkbox.click()

    if not yandex_checkbox.is_selected():
        yandex_checkbox.click()
"""
def change_dropdown_selection(driver, text):
    # Find all dropdowns and then select the second one
    dropdowns = WebDriverWait(driver, 10).until(ec.presence_of_all_elements_located(
        (By.CSS_SELECTOR, ".btn-group.bootstrap-select .btn.dropdown-toggle.btn-default")))
    if len(dropdowns) < 2:
        raise Exception("Less than two dropdowns found on the page.")
    # Click the second dropdown
    dropdowns[1].click()

    # Select the option
    # You may need to adjust the logic here if the options are also dynamic
    option = WebDriverWait(driver, 10).until(
        ec.element_to_be_clickable((By.XPATH, f"//span[normalize-space(.)='{text}']")))
    option.click()


def input_url_and_submit(driver, strings):
    try:
        fill_out_form(driver, strings)

        # Change the dropdown selection here
        change_dropdown_selection(driver, "Москва")

        submit_button = WebDriverWait(driver, 10).until(
            ec.element_to_be_clickable((By.CSS_SELECTOR, ".btn2#tool-form-btn")))
        submit_button.click()

        # Wait for the table to appear with retries
        max_retries = 10
        retries = 0
        while retries < max_retries:
            try:
                WebDriverWait(driver, 60).until(ec.presence_of_element_located((By.CSS_SELECTOR, "table.table.table-bordered.detailed.table-headed.sortable")))
                break
            except TimeoutException:
                retries += 1
                print(f"Retry {retries} of {max_retries}...")
                if retries == max_retries:
                    print("Reloading the page...")
                    driver.refresh()
                    # Refill the form after reloading
                    fill_out_form(driver, strings)
                    retries = 0  # Reset the retry counter after reloading
        else:
            raise Exception("Failed to find the table after maximum retries.")

        csv_button = WebDriverWait(driver, 10).until(ec.element_to_be_clickable((By.CSS_SELECTOR, ".btn.btn-success.margin_top20")))
        csv_button.click()
        WebDriverWait(driver, 10).until(ec.presence_of_element_located((By.CSS_SELECTOR, "div.modal-dialog.modal-sm[role='document']")))
        download_button = WebDriverWait(driver, 10).until(ec.element_to_be_clickable((By.CSS_SELECTOR, "div.modal-dialog.modal-sm[role='document'] button.btn.btn-success")))
        download_button.click()
        WebDriverWait(driver, 4)
    except Exception as e:
        print(f"Error inputting URL and submitting: {e}")


def move_downloaded_files():
    src_dir = "C:\\Users\\0verlay\\Downloads"
    dst_dir = "E:\\WORK\\Python\\SeoScraper\\files"
    today = datetime.today().strftime('%Y-%m-%d')
    for file_name in os.listdir(src_dir):
        if file_name.startswith("Позиции") and file_name.endswith(".csv") and today in file_name:
            shutil.move(os.path.join(src_dir, file_name), os.path.join(dst_dir, file_name))


def main():
    # Delete all files in the 'files' directory
    # delete_files_in_directory("E:\\WORK\\Python\\SeoScraper\\files")

    driver = setup_driver()
    strings = read_csv_file('your_csv_file_1.csv')
    for i in range(0, len(strings), 100):
        driver.get("https://be1.ru/position-yandex-google")
        input_url_and_submit(driver, strings[i:i + 100])
        move_downloaded_files()
        time.sleep(2)
        if len(driver.window_handles) > 1:
            driver.close()
            driver.switch_to.window(driver.window_handles[0])
    driver.quit()

if __name__ == "__main__":
    main()
