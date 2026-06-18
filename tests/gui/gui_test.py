#!/usr/bin/env python

# Selenium test script for PSDI Glorius Plot Generator Service.

import csv
import json
import math
import os
import re
import shutil
import sys
import time
from collections.abc import Callable
from multiprocessing import Process

import pytest
from pypdf import PdfReader

import psdi_glorius_plot
from psdi_glorius_plot import constants as const

# Skip all tests in this module if required packages for GUI testing aren't installed
try:
    from rocrate_validator import models as rocv_models
    from rocrate_validator import services as rocv_services
    from selenium import webdriver
    from selenium.common.exceptions import NoAlertPresentException
    from selenium.webdriver import FirefoxOptions, Keys
    from selenium.webdriver.common.action_chains import ActionChains
    from selenium.webdriver.common.alert import Alert
    from selenium.webdriver.common.by import By
    from selenium.webdriver.firefox.service import Service as FirefoxService
    from selenium.webdriver.firefox.webdriver import WebDriver
    from selenium.webdriver.remote.errorhandler import MoveTargetOutOfBoundsException, StaleElementReferenceException
    from selenium.webdriver.remote.webelement import WebElement
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.support.select import Select
    from selenium.webdriver.support.ui import WebDriverWait
    from webdriver_manager.firefox import GeckoDriverManager

    from psdi_glorius_plot.gui.setup import start_app

except ImportError:
    # We put the importorskip commands here rather than above so that standard imports can be used by static analysis
    # tools where possible, and the importorskip is used here so pytest will stop processing immediately if things can't
    # be imported - pytest.mark.skip won't do that
    pytest.importorskip("Flask")
    pytest.importorskip("selenium")
    pytest.importorskip("webdriver_manager.firefox")

DEFAULT_ORIGIN = "http://127.0.0.1:5000"

# Timeout for waiting for things, and step of time we'll check at
TIMEOUT_LONG = 10
TIMEOUT_SHORT = 1
TIMESTEP = 0.1

PLOT_GENERATION_TIME = 0.3
SLOW_PLOT_GENERATION_TIME = 2.0


def _local_and_qual(local: str, path: str):
    """Return the local and qualified path to a file"""
    return local, os.path.join(path, local)


# Reused regexes
HTML_TAG_PATTERN = re.compile(r"<[^>]+>(.*?)<\/[^>]+>")
ENCLOSING_TAG_PATTERN = re.compile(r"^<[^>]+>(.*?)<\/[^>]+>$")

MD_SANITISE_PATTERN = re.compile(r"([*~^])")

EM_TAG_PATTERN = re.compile(r"<\/?em>")
STRONG_TAG_PATTERN = re.compile(r"<\/?strong>")
U_TAG_PATTERN = re.compile(r"<\/?u>")
SUB_TAG_PATTERN = re.compile(r"<\/?sub>")
SUP_TAG_PATTERN = re.compile(r"<\/?sup>")

# Constants related to downloaded files and RO-Crate structure
DOWNLOAD_LOCATION = "/tmp"
PLOT_PNG_FILE, PLOT_PNG_QUAL_FILE = _local_and_qual("glorius_plot.png", DOWNLOAD_LOCATION)
PLOT_SVG_FILE, PLOT_SVG_QUAL_FILE = _local_and_qual("glorius_plot.svg", DOWNLOAD_LOCATION)

SAVE_FILE, SAVE_QUAL_FILE = _local_and_qual("glorius_plot_data.json", DOWNLOAD_LOCATION)

RC_FILE_PATTERN = re.compile(r"\d{4}-\d\d-\d\d-\d{6}-glorius-plot-ro-crate\.zip")

RC_EXTRACT_DIR, RC_ROOT_QUAL_DIR = _local_and_qual("glorius-plot/", DOWNLOAD_LOCATION)
RC_ESI_FILE, RC_ESI_QUAL_FILE = _local_and_qual("ESI.pdf", RC_ROOT_QUAL_DIR)
RC_README_FILE, RC_README_QUAL_FILE = _local_and_qual("README.md", RC_ROOT_QUAL_DIR)
RC_METADATA_FILE, RC_METADATA_QUAL_FILE = _local_and_qual("ro-crate-metadata.json", RC_ROOT_QUAL_DIR)
RC_DATA_DIR, RC_DATA_QUAL_DIR = _local_and_qual("data/", RC_ROOT_QUAL_DIR)

RC_SCHEME_FILE, RC_SCHEME_QUAL_FILE = _local_and_qual("reaction_scheme.cdxml", RC_DATA_QUAL_DIR)
RC_STANDARD_COND_FILE, RC_STANDARD_COND_QUAL_FILE = _local_and_qual("standard_conditions.html", RC_DATA_QUAL_DIR)
RC_TEST_COND_FILE, RC_TEST_COND_QUAL_FILE = _local_and_qual("test_conditions.csv", RC_DATA_QUAL_DIR)
RC_PLOT_DIR, RC_PLOT_QUAL_DIR = _local_and_qual("plot/", RC_DATA_QUAL_DIR)

RC_PLOT_FILE, RC_PLOT_QUAL_FILE = _local_and_qual("glorius_plot.png", RC_PLOT_QUAL_DIR)
RC_TABLE_FILE, RC_TABLE_QUAL_FILE = _local_and_qual("sensitivity_table.csv", RC_PLOT_QUAL_DIR)
RC_PREF_FILE, RC_PREF_QUAL_FILE = _local_and_qual("user_preferences.json", RC_PLOT_QUAL_DIR)

L_RC_MANDATORY_FILES = [RC_ESI_QUAL_FILE, RC_README_QUAL_FILE, RC_METADATA_QUAL_FILE, RC_DATA_QUAL_DIR,
                        RC_PLOT_QUAL_DIR, RC_PLOT_QUAL_FILE, RC_TABLE_QUAL_FILE, RC_PREF_QUAL_FILE]
L_RC_OPTIONAL_FILES = [RC_SCHEME_QUAL_FILE, RC_STANDARD_COND_QUAL_FILE, RC_TEST_COND_QUAL_FILE]

# Paths to test data files

PROJECT_PATH = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)), "../.."))

EXAMPLE_CDXML = os.path.join(PROJECT_PATH, "test_data/example_standard_reaction.cdxml")
EXAMPLE_PNG = os.path.join(PROJECT_PATH, "test_data/example_standard_reaction.png")

origin = os.environ.get("ORIGIN", DEFAULT_ORIGIN)

# Paths to test data files

PROJECT_PATH = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)), "../.."))

EXAMPLE_CDXML = os.path.join(PROJECT_PATH, "test_data/example_standard_reaction.cdxml")
EXAMPLE_PNG = os.path.join(PROJECT_PATH, "test_data/example_standard_reaction.png")

# Run tests in production mode and test mode
os.environ[const.PRODUCTION_EV] = "true"
os.environ[const.TEST_EV] = "true"


@pytest.fixture(scope="module", autouse=True)
def common_setup():
    """Autouse fixture which starts the app before tests and stops it afterwards"""

    # If the origin is set to something else, don't start the local server here
    if origin != DEFAULT_ORIGIN:
        yield
        return

    server = Process(target=start_app)
    server.start()

    # Change to the root dir of the project for running the tests, in case this was invoked elsewhere
    old_cwd = os.getcwd()
    os.chdir(os.path.join(psdi_glorius_plot.__path__[0], ".."))

    yield

    server.terminate()
    server.join()

    # Change back to the previous directory
    os.chdir(old_cwd)


@pytest.fixture(scope="module")
def driver():
    """Get a headless Firefox web driver"""

    driver_path = os.environ.get("DRIVER")

    # The below is the likely installed path of the driver, which can be uncommented when testing locally to speed
    # things up and avoid bugs caused by being API rate limited
    # driver_path = os.environ.get("HOME") + "/.wdm/drivers/geckodriver/linux64/v0.36.0/geckodriver"

    if not driver_path:
        driver_path = GeckoDriverManager().install()
        print(f"Gecko driver installed to {driver_path}")

    profile = webdriver.FirefoxProfile()
    profile.set_preference('browser.download.folderList', 2)
    profile.set_preference('browser.download.manager.showWhenStarting', False)
    profile.set_preference('browser.download.dir', DOWNLOAD_LOCATION)
    profile.set_preference('browser.helperApps.neverAsk.saveToDisk', 'image/png')

    opts = FirefoxOptions()
    opts.add_argument("--headless")
    opts.profile = profile
    ff_driver = webdriver.Firefox(service=FirefoxService(driver_path),
                                  options=opts)
    yield ff_driver
    ff_driver.quit()


def wait_for_cover_hidden(root: WebDriver):
    """Wait until the page cover is removed"""
    WebDriverWait(root, TIMEOUT_LONG).until(EC.invisibility_of_element((By.XPATH, "//div[@id='cover']")))


def scroll_element_into_view(driver: WebDriver, e: WebElement) -> WebElement:
    driver.execute_script("arguments[0].scrollIntoView({behavior: 'instant', block: 'center'});", e)
    wait_for_success(lambda: ActionChains(driver).move_to_element(e).perform())
    return e


def send_keys(driver: WebDriver, keys: str, shift=False):
    if not shift:
        ActionChains(driver).send_keys(keys).perform()
    else:
        ActionChains(driver).key_down(Keys.SHIFT).send_keys(keys).key_up(Keys.SHIFT).perform()


def wait_for_element(driver: WebDriver | WebElement,
                     xpath: str,
                     root: WebElement | None = None,
                     by=By.XPATH,
                     wait_for_clickable: bool = True) -> WebElement:
    """Shortcut for boilerplate to wait until a web element is visible"""

    if root is None:
        root = driver

    WebDriverWait(root, TIMEOUT_LONG).until(EC.presence_of_element_located((by, xpath)))
    e: WebElement = root.find_element(by, xpath)

    # Some elements might take some time to load into place, so we loop for a bit to give them a chance to do so if we
    # can't immediately do so
    time_elapsed = 0
    while time_elapsed < TIMEOUT_LONG:
        try:
            scroll_element_into_view(driver, e)
            break
        except MoveTargetOutOfBoundsException:
            time_elapsed += TIMESTEP
            time.sleep(TIMESTEP)

    if wait_for_clickable:
        WebDriverWait(root, TIMEOUT_LONG).until(EC.element_to_be_clickable((by, xpath)))

    return e


def wait_for_condition(cond: Callable, timeout=TIMEOUT_SHORT) -> bool:
    """Waits for a condition to be true, return True if it is within the timeout, False otherwise"""

    time_elapsed = 0

    while time_elapsed < timeout:
        if cond():
            break
        time_elapsed += TIMESTEP
        time.sleep(TIMESTEP)

    else:
        return False

    return True


def wait_for_success(action: Callable, timeout=TIMEOUT_SHORT):
    """Waits for an action to be successful, return True if it is within the timeout, False otherwise"""

    time_elapsed = 0

    while time_elapsed < timeout:
        try:
            action()
            break
        except Exception:
            time_elapsed += TIMESTEP
            if time_elapsed >= timeout:
                raise


def _init_page(driver):
    """Initialise the home page for tests and wait for the page cover to be removed"""
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)


def test_initial_frontpage(driver: WebDriver):
    """A basic unit test that checks that the front page is displayed with the expected content"""
    _init_page(driver)

    # Check that the front page contains expected elements

    # Check page title is present with the correct text
    assert (wait_for_element(driver, "//header//h5")).text == "Glorius Plot Generator"


def test_navigate_home(driver: WebDriver):
    """Test that the user can navigate from the page to the PSDI home page using the logo in the header"""
    _init_page(driver)
    wait_for_element(driver, "//a[contains(@class,'navbar__logo')]").click()
    assert (wait_for_element(driver, "//h1")).text == "Physical Sciences Data Infrastructure"


def test_navigate_header(driver: WebDriver):
    """Test that the user can use the header to navigate between pages of the site"""
    _init_page(driver)

    def _find_header_link(text: str):
        # Get a list of links in the header, and find the one whose text matches the desired value
        l_header_links = driver.find_elements(By.CSS_SELECTOR, ".navbar__link")
        return [x for x in l_header_links if x.text == text][0]

    def _click_header_link(text: str, url_segment: str):
        el = _find_header_link(text)
        scroll_element_into_view(driver, el)
        el.click()
        WebDriverWait(driver, 10).until(EC.url_contains(url_segment))

    # Test that we can navigate to the Documentation page through the header link
    _click_header_link("Documentation", "documentation.html")
    assert (wait_for_element(driver, "//h1")).text == "Documentation"

    # Test that we can navigate back to the home page through the header link
    _click_header_link("Home", "index.html")
    assert (wait_for_element(driver, "//h1")).text == "PSDI Glorius Plot Generator"

    # Now try instead clicking the title link on the Documentation page
    _click_header_link("Documentation", "documentation.html")
    driver.find_element(By.CSS_SELECTOR, ".navbar__title").click()
    WebDriverWait(driver, 10).until(EC.url_contains("index.html"))
    assert (wait_for_element(driver, "//h1")).text == "PSDI Glorius Plot Generator"

    # Test using the header link to go to the Organic Toolkit Home page
    _click_header_link("Organic Toolkit Home", "organic-toolkit.psdi.ac.uk")
    assert (wait_for_element(driver, "//h1")).text == "PSDI Organic Toolkit"

    # Test using the header link to get to the Provide Feedback form from both the home and Documentation pages
    _init_page(driver)
    _click_header_link("Provide Feedback", "forms.office.com/pages/responsepage.aspx")
    assert (wait_for_element(driver, "//div[@id='FormTitleId_titleAriaId']/div/span/b/span")
            ).text == "PSDI Glorius Plot Generator: Feedback Form"

    _init_page(driver)
    _click_header_link("Documentation", "documentation.html")
    _click_header_link("Provide Feedback", "forms.office.com/pages/responsepage.aspx")
    assert (wait_for_element(driver, "//div[@id='FormTitleId_titleAriaId']/div/span/b/span")
            ).text == "PSDI Glorius Plot Generator: Feedback Form"


def test_light_dark_mode(driver: WebDriver):
    """Test that the light/dark mode toggle in the header behaves as expected"""
    _init_page(driver)

    # Check that we initially find the sun icon to toggle to dark mode, then click it to toggle
    wait_for_element(driver, "//button[contains(@class,'color-mode-toggle')]" +
                     "//img[contains(@class,'lm-only')]", wait_for_clickable=True).click()

    # Now check for the moon icon to toggle to light mode, and try clicking it as well
    wait_for_element(driver, "//button[contains(@class,'color-mode-toggle')]" +
                     "//img[contains(@class,'dm-only')]", wait_for_clickable=True).click()

    # And finally check that the sun icon has returned
    wait_for_element(driver, "//button[contains(@class,'color-mode-toggle')]" +
                     "//img[contains(@class,'lm-only')]", wait_for_clickable=True)


def test_navigate_policies(driver: WebDriver):
    """Test that the user can navigate to the PSDI policies via footer links"""

    def _find_footer_link(text: str):
        # Get a list of links in the header, and find the one whose text matches the desired value
        l_footer_links = driver.find_elements(By.CSS_SELECTOR, "ul.footer__items a")
        return [x for x in l_footer_links if x.text == text][0]

    def _click_footer_link(text: str, url_segment: str):
        el = _find_footer_link(text)
        scroll_element_into_view(driver, el)
        el.click()
        WebDriverWait(driver, 10).until(EC.url_contains(url_segment))

    # Test that we can navigate to the Privacy policy via the footer link
    _init_page(driver)
    _click_footer_link("Privacy", "www.psdi.ac.uk/privacy/")
    assert (wait_for_element(driver, "//h1")).text == "Privacy policy"

    # Test that we can navigate to the Terms and Conditions via the footer link
    _init_page(driver)
    _click_footer_link("Terms and Conditions", "www.psdi.ac.uk/terms-and-conditions/")
    assert (wait_for_element(driver, "//h1")).text == "Terms & Conditions"


def test_outcome_select(driver: WebDriver):
    """Test that the outcome can be changed to produce desired effects - showing/hiding custom input, updating text
    of coloumn in table, etc.
    """
    _init_page(driver)

    # Get the select box used for the outcome
    outcome_select_element = wait_for_element(driver, "//*[@id='os-0']")
    outcome_select = Select(outcome_select_element)

    # Get the outcome column label we'll be testing at various points
    outcome_column_label = wait_for_element(driver, "//th[contains(@class,'sample-heading')]")

    # Try selecting spectroscoping yield, and check that the column in the table is updated
    TEST_OUTCOME_1 = "Spectroscopic Yield (%)"

    scroll_element_into_view(driver, outcome_select_element)
    wait_for_success(lambda: outcome_select.select_by_value(TEST_OUTCOME_1))

    scroll_element_into_view(driver, outcome_column_label)
    assert (wait_for_condition(lambda: outcome_column_label.text == TEST_OUTCOME_1))

    # Try inputting a custom outcome, and check that the column in the table is updated to match
    TEST_OUTCOME_2 = "Test outcome"

    scroll_element_into_view(driver, outcome_select_element)
    wait_for_success(lambda: outcome_select.select_by_value("Other"))

    outcome_input_element = wait_for_element(driver,
                                             "//*[@id='ol-0']//*[contains(@class,'ql-editor')]",
                                             wait_for_clickable=False)
    outcome_input_element.send_keys(TEST_OUTCOME_2)

    scroll_element_into_view(driver, outcome_column_label)
    assert (wait_for_condition(lambda: outcome_column_label.text == TEST_OUTCOME_2))


def _get_num_condition_rows(driver: WebDriver):
    l_e = driver.find_elements(By.XPATH, "//tr[contains(@class,'condition-row')]")
    return len(l_e)


def _set_num_condition_rows(driver: WebDriver, n: int):
    row_select_element = wait_for_element(driver, "//select[@id='num-condition']")
    row_select = Select(row_select_element)
    wait_for_success(lambda: row_select.select_by_value(str(n)))


def test_num_conditions_control(driver: WebDriver):
    """Test that adding/removing/setting condition rows works as expected"""
    _init_page(driver)

    # Check that we start with 5 rows
    assert _get_num_condition_rows(driver) == 5

    # Check that the select box for setting a specific number of rows works as expected
    _set_num_condition_rows(driver, 9)
    assert _get_num_condition_rows(driver) == 9

    _set_num_condition_rows(driver, 7)
    assert _get_num_condition_rows(driver) == 7

    # Try clicking buttons to add/remove rows, and check that the number of rows is as expected afterwards
    btn_add_row_0 = wait_for_element(driver, "//button[@id='add-cb-0']")
    btn_add_row_0.click()
    btn_add_row_0.click()
    btn_add_row_0.click()
    assert _get_num_condition_rows(driver) == 10

    btn_remove_row_0 = wait_for_element(driver, "//button[@id='remove-cb-0']")
    btn_remove_row_0.click()
    assert _get_num_condition_rows(driver) == 9

    # The button we just clicked should be deleted, so we shouldn't be able to click it again
    with pytest.raises(StaleElementReferenceException):
        btn_remove_row_0.click()


def _get_num_sample_columns(driver: WebDriver):
    l_e = driver.find_elements(By.XPATH, "//th[contains(@class,'sample-heading')]")
    return len(l_e)


def _set_num_sample_columns(driver: WebDriver, n: int):
    col_select_element = wait_for_element(driver, "//select[@id='num-sample']")
    col_select = Select(col_select_element)
    wait_for_success(lambda: col_select.select_by_value(str(n)))


def test_num_samples_control(driver: WebDriver):
    """Test that adding/removing/setting sample columns works as expected"""
    _init_page(driver)

    # Check that we start with 1 column
    assert _get_num_sample_columns(driver) == 1

    # Check that the mean column isn't visible when there's only one column
    assert not driver.find_element(By.XPATH, "//td[contains(@class,'button-mean-cell')]").is_displayed()
    assert not driver.find_element(By.XPATH, "//th[contains(@class,'mean-heading')]").is_displayed()
    assert not driver.find_element(By.XPATH, "//td[contains(@class,'baseline-mean-cell')]").is_displayed()
    assert not any([e.is_displayed() for e in driver.find_elements(
        By.XPATH, "//td[contains(@class,'mean-value-cell')]")])

    # Check that the select box for setting a specific number of columns works as expected
    _set_num_sample_columns(driver, 5)
    assert _get_num_sample_columns(driver) == 5

    # Check that the mean column is now visible
    assert driver.find_element(By.XPATH, "//td[contains(@class,'button-mean-cell')]").is_displayed()
    assert driver.find_element(By.XPATH, "//th[contains(@class,'mean-heading')]").is_displayed()
    assert driver.find_element(By.XPATH, "//td[contains(@class,'baseline-mean-cell')]").is_displayed()
    assert all([e.is_displayed() for e in driver.find_elements(
        By.XPATH, "//td[contains(@class,'mean-value-cell')]")])

    _set_num_sample_columns(driver, 3)
    assert _get_num_sample_columns(driver) == 3

    # Try clicking buttons to add/remove rows, and check that the number of columns is as expected afterwards
    btn_add_col_0 = wait_for_element(driver, "//button[@id='add-sb-0']")
    btn_add_col_0.click()
    btn_add_col_0.click()
    btn_add_col_0.click()
    assert _get_num_sample_columns(driver) == 6

    btn_remove_col_0 = wait_for_element(driver, "//button[@id='remove-sb-0']")
    btn_remove_col_0.click()
    assert _get_num_sample_columns(driver) == 5

    # The button we just clicked should be deleted, so we shouldn't be able to click it again
    with pytest.raises(StaleElementReferenceException):
        btn_remove_col_0.click()

    # Check that the mean column disappears when the number of columns is reduced to 1
    _set_num_sample_columns(driver, 1)
    assert not driver.find_element(By.XPATH, "//td[contains(@class,'button-mean-cell')]").is_displayed()
    assert not driver.find_element(By.XPATH, "//th[contains(@class,'mean-heading')]").is_displayed()
    assert not driver.find_element(By.XPATH, "//td[contains(@class,'baseline-mean-cell')]").is_displayed()
    assert not any([e.is_displayed() for e in driver.find_elements(
        By.XPATH, "//td[contains(@class,'mean-value-cell')]")])


def test_table_navigation(driver: WebDriver):
    """Test that the table can be navigated as expected with tab and enter"""
    _init_page(driver)

    def _send_keys(keys: str, shift: bool = False):
        send_keys(driver, keys, shift)

    def _is_focused(e: WebElement) -> bool:
        return e == driver.switch_to.active_element

    # Start by setting up the number of rows and columns, then filling with random data
    TEST_NUM_CONDITION_ROWS = 4
    _set_num_condition_rows(driver, TEST_NUM_CONDITION_ROWS)
    TEST_NUM_SAMPLE_COLS = 2
    _set_num_sample_columns(driver, TEST_NUM_SAMPLE_COLS)
    fill_random_button = wait_for_element(driver, "//button[@id='fill-random']")
    fill_random_button.click()

    # We should see an alert here warning that entered data will be lost - accept it
    Alert(driver).accept()

    # Fill up arrays with references to each of the input elements in the table
    l_baseline_inputs: list[WebElement] = driver.find_elements(By.XPATH, "//input[contains(@class,'baseline-value')]")
    l_row_remove_buttons: list[WebElement] = driver.find_elements(
        By.XPATH, "//button[contains(@class,'remove-condition')]")
    l_row_add_buttons: list[WebElement] = driver.find_elements(By.XPATH, "//button[contains(@class,'add-condition')]")
    l_condition_label_inputs: list[WebElement] = [None] * TEST_NUM_CONDITION_ROWS
    ll_value_inputs: list[list[WebElement]] = [None] * TEST_NUM_CONDITION_ROWS
    table_element: WebElement = wait_for_element(driver, "*//table[contains(@class,'sensitivity-table')]")
    l_table_rows = table_element.find_elements(By.XPATH, "*//tr[contains(@class,'condition-row')]")
    for i in range(TEST_NUM_CONDITION_ROWS):
        row = l_table_rows[i]
        l_condition_label_inputs[i] = row.find_element(By.XPATH, ".//td[contains(@class,'condition-label-cell')]" +
                                                                 "//*[contains(@class,'ql-editor')]")
        ll_value_inputs[i] = row.find_elements(By.XPATH, ".//td[contains(@class,'sample-value-cell')]//input")

    # Select the first baseline input, and check that we can tab through to the other element and back
    scroll_element_into_view(driver, l_baseline_inputs[0])
    l_baseline_inputs[0].click()
    assert _is_focused(l_baseline_inputs[0])

    _send_keys(Keys.TAB)
    assert _is_focused(l_baseline_inputs[1])

    _send_keys(Keys.TAB, shift=True)
    assert _is_focused(l_baseline_inputs[0])

    # Tab to the next line, and check that the first condition label input is selected, then the value input, and back
    _send_keys(Keys.TAB*TEST_NUM_SAMPLE_COLS)
    assert _is_focused(l_condition_label_inputs[0])

    _send_keys(Keys.TAB)
    assert _is_focused(ll_value_inputs[0][0])

    _send_keys(Keys.TAB, shift=True)
    assert _is_focused(l_condition_label_inputs[0])

    # Now try navigating with Enter and Shift+Enter
    _send_keys(Keys.ENTER)
    assert _is_focused(l_condition_label_inputs[1])

    _send_keys(Keys.ENTER, shift=True)
    assert _is_focused(l_condition_label_inputs[0])

    # And try navigating to the next column and back
    ActionChains(driver).send_keys_to_element(driver.switch_to.active_element,
                                              Keys.ENTER*TEST_NUM_CONDITION_ROWS).perform()
    assert _is_focused(l_baseline_inputs[0])

    _send_keys(Keys.ENTER)
    assert _is_focused(ll_value_inputs[0][0])

    _send_keys(Keys.ENTER*2, shift=True)
    assert _is_focused(l_condition_label_inputs[-1])

    # Now test navigating to the row add/remove buttons with escape
    scroll_element_into_view(driver, l_condition_label_inputs[0])
    l_condition_label_inputs[0].click()

    _send_keys(Keys.ESCAPE)
    assert _is_focused(l_row_remove_buttons[0])

    _send_keys(Keys.TAB)
    assert _is_focused(l_row_add_buttons[0])

    _send_keys(Keys.TAB+Keys.ENTER+Keys.ESCAPE)
    assert _is_focused(l_row_remove_buttons[1])

    _send_keys(Keys.TAB)
    assert _is_focused(l_row_add_buttons[1])

    _send_keys(Keys.TAB, shift=True)
    assert _is_focused(l_row_remove_buttons[1])


def _check_dev_outline_presence(driver: WebDriver, dev: str, present=True):

    # To keep the asserts giving full info in either case without much code duplication, we use
    # False = 1-True and True = 1-False to flip booleans if we're looking for the outline to not be present
    if present:
        optional_one = 0
        optional_minus = 1
    else:
        optional_one = 1
        optional_minus = -1

    assert optional_one + optional_minus*("col-selected-top" in
                                          driver.find_element(By.XPATH,
                                                              f"//th[contains(@class,'{dev}-deviation-heading')]")
                                          .get_attribute("class"))
    assert optional_one + optional_minus*("col-selected" in
                                          driver.find_element(By.XPATH,
                                                              f"//td[contains(@class,'baseline-{dev}-deviation-cell')]")
                                          .get_attribute("class"))
    assert all(optional_one + optional_minus*("col-selected" in e.get_attribute("class"))
               for e in driver.find_elements(By.XPATH,
                                             f"//td[contains(@class,'{dev}-deviation-value-cell')]"))
    assert optional_one + optional_minus*("col-selected-bottom" in
                                          driver.find_element(By.XPATH,
                                                              f"//td[contains(@class,'plot-select-{dev}-cell')]")
                                          .get_attribute("class"))


def _check_value_outline_presence(driver: WebDriver, present=True):

    # To keep the asserts giving full info in either case without much code duplication, we use
    # False = 1-True and True = 1-False to flip booleans if we're looking for the outline to not be present
    if present:
        optional_one = 0
        optional_minus = 1
    else:
        optional_one = 1
        optional_minus = -1

    if _get_num_sample_columns(driver) == 1:
        sample_or_mean = "sample"
        baseline_class = "baseline-value-cell"

        assert optional_one + optional_minus*("col-selected-top" in
                                              driver.find_element(By.XPATH,
                                                                  "//td[contains(@class,'sample-button-cell')]")
                                              .get_attribute("class"))
        assert optional_one + optional_minus*("col-selected" in
                                              driver.find_element(By.XPATH, "//th[contains(@class,'sample-heading')]")
                                              .get_attribute("class"))
    else:
        sample_or_mean = "mean"
        baseline_class = "baseline-mean-cell"

        assert optional_one + optional_minus*("col-selected-top" in
                                              driver.find_element(By.XPATH, "//th[contains(@class,'mean-heading')]")
                                              .get_attribute("class"))

    assert optional_one + optional_minus*("col-selected" in
                                          driver.find_element(By.XPATH,
                                                              f"//td[contains(@class,'{baseline_class}')]")
                                          .get_attribute("class"))
    assert all(optional_one + optional_minus*("col-selected" in e.get_attribute("class")) for e in
               driver.find_elements(By.XPATH, f"//td[contains(@class,'{sample_or_mean}-value-cell')]"))
    assert optional_one + optional_minus*("col-selected-bottom" in
                                          driver.find_element(By.XPATH,
                                                              "//td[contains(@class,'plot-select-mean-cell')]")
                                          .get_attribute("class"))


def test_value_to_plot_option(driver: WebDriver):
    """Test that the radio input to select which value to plot works as expected"""
    _init_page(driver)

    mean_radio = wait_for_element(driver, "//input[@id='plot-mean']")
    abs_radio = wait_for_element(driver, "//input[@id='plot-abs']")
    rel_radio = wait_for_element(driver, "//input[@id='plot-rel']")

    # When the page is first loaded, check that the Deviation (%) column is selected
    assert not mean_radio.is_selected()
    assert not abs_radio.is_selected()
    assert rel_radio.is_selected()

    # Check that the cells in the relative deviation column all have the classes to indicate they're outlined
    _check_dev_outline_presence(driver, "rel", True)

    # And check that the absolute deviation column is NOT outlined
    _check_dev_outline_presence(driver, "abs", False)

    # And similarly the value column also shouldn't be outlined
    _check_value_outline_presence(driver, False)

    # Select the absolute deviation, and check that the chart updates as expected
    scroll_element_into_view(driver, abs_radio).click()
    assert not mean_radio.is_selected()
    assert abs_radio.is_selected()
    assert not rel_radio.is_selected()

    # The relative deviation should now NOT be selected
    _check_dev_outline_presence(driver, "rel", False)

    # And the absolute deviation now should be selected
    _check_dev_outline_presence(driver, "abs", True)

    # And the value column still should not be selected
    _check_value_outline_presence(driver, False)

    # Now select the value column and do the same checks
    scroll_element_into_view(driver, mean_radio).click()
    assert mean_radio.is_selected()
    assert not abs_radio.is_selected()
    assert not rel_radio.is_selected()

    _check_dev_outline_presence(driver, "rel", False)
    _check_dev_outline_presence(driver, "abs", False)
    _check_value_outline_presence(driver, True)

    # Now let's try adding sample columns, and make sure the outline updates to move to the mean column (the same
    # function will check the mean column instead now that we have more than one column)
    _set_num_sample_columns(driver, 2)
    _check_value_outline_presence(driver, True)

    # And check the other columns are un-outlined as well, just to be sure
    _check_dev_outline_presence(driver, "rel", False)
    _check_dev_outline_presence(driver, "abs", False)

    # Finally, select the relative column again and check all is well moving back to it
    scroll_element_into_view(driver, rel_radio).click()
    assert not mean_radio.is_selected()
    assert not abs_radio.is_selected()
    assert rel_radio.is_selected()

    _check_dev_outline_presence(driver, "rel", True)
    _check_dev_outline_presence(driver, "abs", False)
    _check_value_outline_presence(driver, False)


def test_calcs(driver: WebDriver):
    """Test that values in the plot are calculated properly"""
    _init_page(driver)

    # Size the table so we have 10 rows and columns
    _set_num_condition_rows(driver, 10)
    _set_num_sample_columns(driver, 10)

    # Fill with random data
    fill_random_button = wait_for_element(driver, "//button[@id='fill-random']")
    fill_random_button.click()

    # We should see an alert here warning that entered data will be lost - accept it
    Alert(driver).accept()

    # Wait till the first baseline element has a non-zero value
    first_baseline_input = wait_for_element(driver, "//input[contains(@class,'baseline-value')]")
    assert wait_for_condition(lambda: bool(first_baseline_input.get_attribute("value")))

    # Now, let's test that the mean and deviation values are calculated correctly. Start with the baseline row, which
    # just has the mean to calculate, which we'll need to calculate the deviation of other rows
    l_baseline_inputs = driver.find_elements(By.XPATH, "//input[contains(@class,'baseline-value')]")
    baseline_mean = sum([float(x.get_attribute("value")) for x in l_baseline_inputs])/len(l_baseline_inputs)

    baseline_mean_input = driver.find_element(By.XPATH, "//td[contains(@class, 'baseline-mean-cell')]" +
                                              "//input[contains(@class,'mean-value')]")
    assert math.isclose(baseline_mean, float(baseline_mean_input.get_attribute("value")), abs_tol=0.5)

    # Now go through each row and check that it's calculated correctly
    l_condition_rows = driver.find_elements(By.XPATH, "//tr[contains(@class,'condition-row')]")
    for condition_row in l_condition_rows:
        l_sample_inputs = condition_row.find_elements(By.XPATH, "*//input[contains(@class,'sample-value')]")
        sample_mean = sum([float(x.get_attribute("value")) for x in l_sample_inputs])/len(l_sample_inputs)
        sample_abs_dev = sample_mean - baseline_mean
        sample_rel_dev = 100*sample_abs_dev / baseline_mean

        sample_mean_input = condition_row.find_element(By.XPATH, "*//input[contains(@class,'mean-value')]")
        assert math.isclose(sample_mean, float(sample_mean_input.get_attribute("value")), abs_tol=0.5)

        sample_abs_dev_input = condition_row.find_element(By.XPATH, "*//input[contains(@class,'abs-deviation-value')]")
        assert math.isclose(sample_abs_dev, float(sample_abs_dev_input.get_attribute("value")), abs_tol=0.5)

        sample_rel_dev_input = condition_row.find_element(By.XPATH, "*//input[contains(@class,'rel-deviation-value')]")
        assert math.isclose(sample_rel_dev, float(sample_rel_dev_input.get_attribute("value")), abs_tol=0.5)


def _get_plot_width(driver: WebDriver):
    plot = driver.find_element(By.XPATH, "//canvas[@id='glorius-plot']")
    width_input = driver.find_element(By.XPATH, "//input[@id='width-input']")
    assert wait_for_condition(lambda: int(plot.get_attribute("width")) ==
                              int(float(width_input.get_attribute("value"))))
    return int(float(width_input.get_attribute("value")))


def _set_plot_width(driver: WebDriver, x: float):
    width_input = wait_for_element(driver, "//input[@id='width-input']")
    width_input.send_keys(Keys.BACKSPACE*20 + Keys.DELETE*20 + str(x))
    # Click the plot so that the width input is defocused and an update will be triggered
    wait_for_element(driver, "//canvas[@id='glorius-plot']").click()


def _get_plot_height(driver: WebDriver):
    plot = driver.find_element(By.XPATH, "//canvas[@id='glorius-plot']")
    height_input = driver.find_element(By.XPATH, "//input[@id='height-input']")
    assert wait_for_condition(lambda: int(plot.get_attribute("height")) ==
                              int(float(height_input.get_attribute("value"))))
    return int(float(height_input.get_attribute("value")))


def _set_plot_height(driver: WebDriver, x: float):
    height_input = wait_for_element(driver, "//input[@id='height-input']")
    height_input.send_keys(Keys.BACKSPACE*20 + Keys.DELETE*20 + str(x))
    # Click the plot so that the height input is defocused and an update will be triggered
    wait_for_element(driver, "//canvas[@id='glorius-plot']").click()


def _get_label_fontsize(driver: WebDriver):
    label_fontsize_input: WebElement = driver.find_element(By.XPATH, "//input[@id='label-font-size-input']")
    return float(label_fontsize_input.get_attribute("value"))


def _set_label_fontsize(driver: WebDriver, x: float):
    label_fontsize_input: WebElement = driver.find_element(By.XPATH, "//input[@id='label-font-size-input']")
    label_fontsize_input.send_keys(Keys.BACKSPACE*20 + Keys.DELETE*20 + str(x))
    # Click the plot so that the fontsize input is defocused and an update will be triggered
    wait_for_element(driver, "//canvas[@id='glorius-plot']").click()


def _get_axis_fontsize(driver: WebDriver):
    axis_fontsize_input: WebElement = driver.find_element(By.XPATH, "//input[@id='axis-font-size-input']")
    return float(axis_fontsize_input.get_attribute("value"))


def _set_axis_fontsize(driver: WebDriver, x: float):
    axis_fontsize_input: WebElement = driver.find_element(By.XPATH, "//input[@id='axis-font-size-input']")
    axis_fontsize_input.send_keys(Keys.BACKSPACE*20 + Keys.DELETE*20 + str(x))
    # Click the plot so that the fontsize input is defocused and an update will be triggered
    wait_for_element(driver, "//canvas[@id='glorius-plot']").click()


def test_fan_plot_controls(driver: WebDriver):
    """Test that toggling fan plot mode makes the radar-plot-specific controls disappear"""
    _init_page(driver)

    # Toggle fan plot mode, checking that nothing goes wrong when we do so
    fan_select_element = wait_for_element(driver, "//select[@id='fan-select']")
    fan_select = Select(fan_select_element)

    wait_for_success(lambda: fan_select.select_by_value("fan"))
    wait_for_success(lambda: fan_select.select_by_value("radar"))


def test_plot_sizing(driver: WebDriver):
    """Test that we can resize the plot properly"""
    _init_page(driver)

    init_plot_width = 600
    init_plot_height = 600
    init_label_fontsize = 18
    init_axis_fontsize = 16

    # Check that the plot has the correct initial dimensions and fontsize
    assert _get_plot_width(driver) == init_plot_width
    assert _get_plot_height(driver) == init_plot_height
    assert _get_label_fontsize(driver) == init_label_fontsize
    assert _get_axis_fontsize(driver) == init_axis_fontsize

    # By default, the aspect ratio should stay fixed, but the font size won't scale. Confirm that this works

    scale = 2
    _set_plot_width(driver, init_plot_width*scale)

    assert _get_plot_width(driver) == init_plot_width*scale
    assert _get_plot_height(driver) == init_plot_height*scale
    assert _get_label_fontsize(driver) == init_label_fontsize
    assert _get_axis_fontsize(driver) == init_axis_fontsize

    scale = 0.5
    _set_plot_height(driver, init_plot_height*scale)

    assert _get_plot_width(driver) == init_plot_width*scale
    assert _get_plot_height(driver) == init_plot_height*scale
    assert _get_label_fontsize(driver) == init_label_fontsize
    assert _get_axis_fontsize(driver) == init_axis_fontsize

    # Reset the plot and check it resets properly
    reset_plot_dims_button = wait_for_element(driver, "//button[@id='reset-plot-dims']")
    reset_plot_dims_button.click()

    assert _get_plot_width(driver) == init_plot_width
    assert _get_plot_height(driver) == init_plot_height
    assert _get_label_fontsize(driver) == init_label_fontsize
    assert _get_axis_fontsize(driver) == init_axis_fontsize

    # Now try turning off aspect ratio lock, and test that height doesn't scale with width and vice-versa
    aspect_ratio_lock_box = wait_for_element(driver, "//input[@id='lock-aspect-ratio']")
    aspect_ratio_lock_box.click()

    width_scale = 1.5
    _set_plot_width(driver, init_plot_width*width_scale)

    assert _get_plot_width(driver) == init_plot_width*width_scale
    assert _get_plot_height(driver) == init_plot_height
    assert _get_label_fontsize(driver) == init_label_fontsize
    assert _get_axis_fontsize(driver) == init_axis_fontsize

    height_scale = 0.75
    _set_plot_height(driver, init_plot_height*height_scale)

    assert _get_plot_width(driver) == init_plot_width*width_scale
    assert _get_plot_height(driver) == init_plot_height*height_scale
    assert _get_label_fontsize(driver) == init_label_fontsize
    assert _get_axis_fontsize(driver) == init_axis_fontsize

    # Now let's test font size scaling. Turn back on aspect ratio lock, turn on font scaling, and reset the plot dims

    scroll_element_into_view(driver, aspect_ratio_lock_box).click()
    wait_for_element(driver, "//input[@id='scale-font-size']").click()
    scroll_element_into_view(driver, reset_plot_dims_button).click()

    scale = 2
    _set_plot_width(driver, init_plot_width*scale)
    assert _get_label_fontsize(driver) == init_label_fontsize*scale
    assert _get_axis_fontsize(driver) == init_axis_fontsize*scale

    scale = 0.5
    _set_plot_height(driver, init_plot_height*scale)
    assert _get_label_fontsize(driver) == init_label_fontsize*scale
    assert _get_axis_fontsize(driver) == init_axis_fontsize*scale


def _clear_download(*l_filenames: str | re.Pattern[str]):
    """Clear files that might have been downloaded in a previous test run"""

    l_download_files = os.listdir(DOWNLOAD_LOCATION)

    # Determine which files to remove
    l_filenames_to_remove: list[str] = []
    for filename in l_filenames:
        # Check if it's a string or Regex and handle appropriate
        if isinstance(filename, str):
            l_filenames_to_remove.append(os.path.join(DOWNLOAD_LOCATION, filename))
            continue
        # Implicit else it's a regex
        for download_file in l_download_files:
            if filename.match(download_file):
                l_filenames_to_remove.append(os.path.join(DOWNLOAD_LOCATION, download_file))
                continue

    # And now remove all files in the list
    for file_to_remove in l_filenames_to_remove:
        try:
            os.remove(file_to_remove)
        except FileNotFoundError:
            pass


def _wait_for_download(filename: str | re.Pattern[str], timeout=TIMEOUT_SHORT) -> str:
    time_elapsed = 0
    file_exists = False
    last_filesize = 0
    new_filesize = 0

    # Continue waiting while any of the following conditions are true:
    # - The file doesn't exist
    # - The file exists, but its size is zero
    # - The file exists, but its size is different from the last time it was checked

    if isinstance(filename, str):
        found_filename = filename
    else:
        found_filename: str = ""

    while not file_exists or new_filesize == 0 or new_filesize != last_filesize:

        # Check if the file exists, checking differently depending on if we're doing a regex match or not
        file_exists = False
        if found_filename:
            file_exists = os.path.isfile(found_filename)
        else:
            l_files = os.listdir(DOWNLOAD_LOCATION)
            for file in l_files:
                if filename.match(file):
                    file_exists = True
                    found_filename = os.path.join(DOWNLOAD_LOCATION, file)
                    break

        last_filesize = new_filesize
        time.sleep(TIMESTEP)
        if file_exists:
            new_filesize = os.path.getsize(found_filename)
        time_elapsed += TIMESTEP
        if time_elapsed > timeout:
            pytest.fail(f"Download of {filename} timed out")

    return found_filename


def _fill_example_data(driver):
    wait_for_element(driver, "//button[@id='fill-example']").click()


def test_download_plot(driver: WebDriver):
    """Test that we can download an image of the plot using the provided button"""

    # If the downloaded files already exists, remove them
    _clear_download(PLOT_PNG_QUAL_FILE, PLOT_SVG_QUAL_FILE)
    _init_page(driver)

    # Wait a moment after the page loads so the plot can be generated
    time.sleep(PLOT_GENERATION_TIME)

    png_download_button = wait_for_element(driver, "//button[@id='export-image-png']")
    png_download_button.click()
    _wait_for_download(PLOT_PNG_QUAL_FILE)

    # Note the filesize of the downloaded plot, check it's non-zero, then delete it
    empty_png_plot_filesize = os.path.getsize(PLOT_PNG_QUAL_FILE)
    assert empty_png_plot_filesize > 0
    _clear_download(PLOT_PNG_QUAL_FILE)

    # Now do the same with the svg version of the plot

    svg_download_button = wait_for_element(driver, "//button[@id='export-image-svg']")
    svg_download_button.click()
    _wait_for_download(PLOT_SVG_QUAL_FILE, TIMEOUT_LONG)

    empty_svg_plot_filesize = os.path.getsize(PLOT_SVG_QUAL_FILE)
    assert empty_svg_plot_filesize > 0
    _clear_download(PLOT_SVG_QUAL_FILE)

    # Add a title to the plot now, so we can test if they seem to appear on the downloaded plot

    title_input_element = driver.find_element(By.XPATH,
                                              "//*[@id='title-input']//*[contains(@class,'ql-editor')]")
    title_input_element.send_keys("Example very very very very very long title")

    # Download it again
    scroll_element_into_view(driver, svg_download_button).click()
    _wait_for_download(PLOT_SVG_QUAL_FILE, TIMEOUT_LONG)

    # Note the filesize of the new downloaded plot, then delete it as well
    title_plot_filesize = os.path.getsize(PLOT_SVG_QUAL_FILE)
    _clear_download(PLOT_SVG_QUAL_FILE)

    # Check that the file size of the plot with the title is larger than for the empty plot
    assert title_plot_filesize > empty_svg_plot_filesize

    # Add labels to plot now, so we can test if they seem to appear on the downloaded plot

    l_label_input_elements = driver.find_elements(By.XPATH,
                                                  "//*[contains(@class,'condition-input')]" +
                                                  "//*[contains(@class,'ql-editor')]")
    for label_input_element in l_label_input_elements:
        label_input_element.send_keys("Label")

    # Download it again
    scroll_element_into_view(driver, svg_download_button).click()
    _wait_for_download(PLOT_SVG_QUAL_FILE, TIMEOUT_LONG)

    # Note the filesize of the new downloaded plot, then delete it as well
    label_plot_filesize = os.path.getsize(PLOT_SVG_QUAL_FILE)
    _clear_download(PLOT_SVG_QUAL_FILE)

    # Check that the file size of the plot with the labels is now even larger than just the title
    assert label_plot_filesize > title_plot_filesize

    # Now, fill the table with example data, wait for the plot to be re-generated, and download again
    _fill_example_data(driver)
    assert wait_for_condition(lambda: _get_num_condition_rows(driver) == 10)

    scroll_element_into_view(driver, svg_download_button).click()
    _wait_for_download(PLOT_SVG_QUAL_FILE, TIMEOUT_LONG)

    # Note the filesize of the new downloaded plot, then delete it as well
    example_plot_filesize = os.path.getsize(PLOT_SVG_QUAL_FILE)
    _clear_download(PLOT_SVG_QUAL_FILE)

    # Check that the file size of the example plot is even larger than the labeled plot, since it's even more
    # complicated
    assert example_plot_filesize > label_plot_filesize


def test_dirty_forms(driver: WebDriver):
    """Run tests that an alert pops up to warn the user before leaving when they've entered data in the form"""
    _init_page(driver)

    # Input some data into the form
    first_baseline_input = wait_for_element(driver, "//input[contains(@class,'baseline-value')]")
    first_baseline_input.clear()
    first_baseline_input.send_keys("90")
    first_baseline_input.click()

    # Note: For some reason, the web driver doesn't properly display a dirty forms alert when leaving the page. This
    # aspect has to be tested manually

    # Try inputting random data, and see if an alert pops up
    fill_random_button = wait_for_element(driver, "//button[@id='fill-random']")
    fill_random_button.click()
    alert = Alert(driver)
    assert "Do you want to proceed?" in alert.text
    alert.dismiss()

    # Test with the example data button
    _fill_example_data(driver)
    alert = Alert(driver)
    assert "Do you want to proceed?" in alert.text
    alert.dismiss()

    # Now, try downloading the plot, and check that the alert no longer pops up afterwards
    download_button = wait_for_element(driver, "//button[@id='export-image-png']")
    download_button.click()

    scroll_element_into_view(driver, fill_random_button).click()
    with pytest.raises(NoAlertPresentException):
        Alert(driver).text

    scroll_element_into_view(driver, first_baseline_input)
    first_baseline_input.clear()
    first_baseline_input.send_keys("90")
    first_baseline_input.click()

    scroll_element_into_view(driver, download_button).click()

    _fill_example_data(driver)
    with pytest.raises(NoAlertPresentException):
        Alert(driver).text


def test_save_load_data(driver: WebDriver):
    """Test that we can save and load data entered in the plot"""

    # If the save file already exists, remove it
    _clear_download(SAVE_QUAL_FILE)
    _init_page(driver)

    # We want to change pretty much every aspect of the plot away from details, then test
    # that all those changes persist when saved and later reloaded

    # Get the select box used for the outcome
    outcome_select_element = wait_for_element(driver, "//*[@id='os-0']")
    outcome_select = Select(outcome_select_element)

    TEST_OUTCOME = "Spectroscopic Yield (%)"
    scroll_element_into_view(driver, outcome_select_element)
    wait_for_success(lambda: outcome_select.select_by_value(TEST_OUTCOME))

    TEST_NUM_CONDITION_ROWS = 7
    _set_num_condition_rows(driver, TEST_NUM_CONDITION_ROWS)

    TEST_NUM_SAMPLE_COLS = 5
    _set_num_sample_columns(driver, TEST_NUM_SAMPLE_COLS)

    abs_radio = wait_for_element(driver, "//input[@id='plot-abs']")
    scroll_element_into_view(driver, abs_radio).click()

    # Fill with random data
    fill_random_button = wait_for_element(driver, "//button[@id='fill-random']")
    fill_random_button.click()

    # We should see an alert here warning that entered data will be lost - accept it
    Alert(driver).accept()

    # Wait till the first baseline element has a non-zero value
    first_baseline_input = wait_for_element(driver, "//input[contains(@class,'baseline-value')]")
    assert wait_for_condition(lambda: bool(first_baseline_input.get_attribute("value")))

    # Record the baseline and sample values
    l_baseline_inputs = driver.find_elements(By.XPATH, "//input[contains(@class,'baseline-value')]")
    l_baseline_samples = [int(x.get_attribute("value")) for x in l_baseline_inputs]

    l_condition_labels = [None] * TEST_NUM_CONDITION_ROWS
    for i in range(TEST_NUM_CONDITION_ROWS):
        id = f"cl-{i}"
        e = driver.find_element(By.XPATH, f"*//*[@id='{id}']/*[contains(@class,'ql-editor')]/p")
        l_condition_labels[i] = e.get_property('innerHTML')

    l_condition_inputs = driver.find_elements(By.XPATH, "*//input[contains(@class,'sample-value')]")
    l_condition_samples = [int(x.get_attribute("value")) for x in l_condition_inputs]

    aspect_ratio_lock_box = wait_for_element(driver, "//input[@id='lock-aspect-ratio']")
    aspect_ratio_lock_box.click()

    fan_select_element = wait_for_element(driver, "//select[@id='fan-select']")
    fan_select = Select(fan_select_element)
    wait_for_success(lambda: fan_select.select_by_value("fan"))

    TEST_WIDTH = 800
    TEST_HEIGHT = 700
    TEST_LABEL_FONTSIZE = 20
    TEST_AXIS_FONTSIZE = 17
    _set_plot_width(driver, TEST_WIDTH)
    _set_plot_height(driver, TEST_HEIGHT)
    _set_label_fontsize(driver, TEST_LABEL_FONTSIZE)
    _set_axis_fontsize(driver, TEST_AXIS_FONTSIZE)

    # Now save the plot
    save_button = wait_for_element(driver, "//button[@id='save-data']")
    save_button.click()
    _wait_for_download(SAVE_QUAL_FILE)

    # Overwrite the data by filling with example data
    _fill_example_data(driver)
    alert = Alert(driver)
    assert "Do you want to proceed?" in alert.text
    alert.accept()

    # Wait a moment for the example data to be filled
    time.sleep(PLOT_GENERATION_TIME)

    # Now load the saved data
    wait_for_element(driver, "//input[@id='load-data-file']").send_keys(SAVE_QUAL_FILE)
    time.sleep(PLOT_GENERATION_TIME)

    # Check that all data we entered before has now been reloaded
    assert outcome_select_element.get_attribute("value") == TEST_OUTCOME
    assert _get_num_condition_rows(driver) == TEST_NUM_CONDITION_ROWS
    assert _get_num_sample_columns(driver) == TEST_NUM_SAMPLE_COLS
    assert abs_radio.get_attribute("checked") == 'true'

    l_baseline_inputs = driver.find_elements(By.XPATH, "//input[contains(@class,'baseline-value')]")
    for i, x in enumerate(l_baseline_inputs):
        assert int(x.get_attribute("value")) == l_baseline_samples[i]

    for i in range(TEST_NUM_CONDITION_ROWS):
        id = f"cl-{i}"
        e = driver.find_element(By.XPATH, f"*//*[@id='{id}']/*[contains(@class,'ql-editor')]/p")
        assert l_condition_labels[i] == e.get_property('innerHTML')

    l_condition_inputs = driver.find_elements(By.XPATH, "*//input[contains(@class,'sample-value')]")
    for i, x in enumerate(l_condition_inputs):
        assert int(x.get_attribute("value")) == l_condition_samples[i]

    assert fan_select.first_selected_option.get_attribute("value") == "fan"

    assert _get_plot_width(driver) == TEST_WIDTH
    assert _get_plot_height(driver) == TEST_HEIGHT
    assert _get_label_fontsize(driver) == TEST_LABEL_FONTSIZE
    assert _get_axis_fontsize(driver) == TEST_AXIS_FONTSIZE


def _start_rocrate_export(driver: WebDriver, allow_already_started=True):
    """Click the button to start exporting a RO-Crate data package"""
    start_export_button = wait_for_element(driver, "export-rocrate-start", by=By.ID)
    start_export_button.click()


def test_rocrate_form(driver: WebDriver):
    """Test that the RO-Crate export form is initially hidden but becomes visible when the button is clicked to start
    exporting it
    """
    _init_page(driver)

    # Check that the RO-Crate export section is initially hidden
    rocrate_input_form = driver.find_element(By.ID, "rocrate-input")
    with pytest.raises(MoveTargetOutOfBoundsException):
        scroll_element_into_view(driver, rocrate_input_form)

    # Click the button to open the form and confirm that it's now visible
    _start_rocrate_export(driver)
    rocrate_input_form.click()

    # Also check that the button to make it visible itself no longer is visible
    with pytest.raises(MoveTargetOutOfBoundsException):
        export_start_button = driver.find_element(By.ID, "export-rocrate-start")
        scroll_element_into_view(driver, export_start_button)


def _clear_downloaded_rocrate():
    _clear_download(RC_FILE_PATTERN)
    shutil.rmtree(RC_ROOT_QUAL_DIR, ignore_errors=True)


def _init_rocrate_export(driver: WebDriver, fill_example=False):
    """Set up the page and the RO-Crate export section"""
    _init_page(driver)

    _clear_downloaded_rocrate()

    _start_rocrate_export(driver)

    if fill_example:
        _fill_example_data(driver)
        wait_for_element(driver, "//input[@id='rocrate-cdxml']").send_keys(EXAMPLE_CDXML)
        wait_for_element(driver, "//input[@id='rocrate-img']").send_keys(EXAMPLE_PNG)


def _validate_rocrate_file(rocrate_qual_file: str) -> bool:
    """Run a validity test on an RO-Crate data package file

    Parameters
    ----------
    rocrate_qual_file : str
        The qualified path to the RO-Crate file to be validated

    Returns
    -------
    bool
        Whether or not the validation is successful
    """

    validation_result = rocv_services.validate(rocv_services.ValidationSettings(
        rocrate_uri=rocrate_qual_file,
        rocrate_relative_root_path=RC_EXTRACT_DIR,
        requirement_severity=rocv_models.Severity.REQUIRED))

    if not validation_result.has_issues():
        return True
    else:
        # If validation was unsuccessful, print out all the issues found to stderr
        print("RO-Crate is invalid!", file=sys.stderr)
        for issue in validation_result.get_issues():
            print(f"Detected issue of severity {issue.severity.name} with check \"{issue.check.identifier}\": " +
                  issue.message, file=sys.stderr)
        return False


def test_rocrate_download_valid(driver: WebDriver):
    """Test that a RO-Crate data package can be downloaded and is valid"""

    _init_rocrate_export(driver)

    wait_for_element(driver, "//button[@id='rocrate-download']").click()

    rocrate_qual_file = _wait_for_download(RC_FILE_PATTERN, TIMEOUT_LONG)

    # Try extracting the file to check that expected files exist/don't exist in it
    shutil.unpack_archive(rocrate_qual_file, extract_dir=os.path.join(DOWNLOAD_LOCATION, RC_EXTRACT_DIR))

    # This is a minimal RO-Crate, so only mandatory files should be present
    for file in L_RC_MANDATORY_FILES:
        assert os.path.exists(file), f"Expected file/dir {file} not found in ROCrate data package"
    for file in L_RC_OPTIONAL_FILES:
        assert not os.path.exists(file), f"Unexpected file/dir {file} found in ROCrate data package"

    assert _validate_rocrate_file(rocrate_qual_file), f"RO-Crate file {rocrate_qual_file} failed validation"

    # Now try with a fully-featured RO-Crate

    # Fill with example data, which will fill most of the RO-Crate export section
    wait_for_element(driver, "//button[@id='fill-example']").click()

    # The only bit missing is that we need to manually provide the reaction image files
    wait_for_element(driver, "//input[@id='rocrate-cdxml']").send_keys(EXAMPLE_CDXML)
    wait_for_element(driver, "//input[@id='rocrate-img']").send_keys(EXAMPLE_PNG)

    # Clear the previous download and download again
    _clear_downloaded_rocrate()
    wait_for_element(driver, "//button[@id='rocrate-download']").click()
    rocrate_qual_file = _wait_for_download(RC_FILE_PATTERN, TIMEOUT_LONG)

    # Try extracting the file to check that expected files exist/don't exist in it
    shutil.unpack_archive(rocrate_qual_file, extract_dir=os.path.join(DOWNLOAD_LOCATION, RC_EXTRACT_DIR))

    # This is a maximal RO-Crate, so all files should be present
    for file in L_RC_MANDATORY_FILES + L_RC_OPTIONAL_FILES:
        assert os.path.exists(file), f"Expected file/dir {file} not found in ROCrate data package"

    assert _validate_rocrate_file(rocrate_qual_file), f"RO-Crate file {rocrate_qual_file} failed validation"


class RoCrateContentsTester:

    fill_example: bool

    @pytest.fixture(scope="class", autouse=True)
    def init_rocrate(self, driver: WebDriver):
        """Prepare and extract the RO-Crate we want to check using default data"""
        _init_rocrate_export(driver, fill_example=self.fill_example)
        wait_for_element(driver, "//button[@id='rocrate-download']").click()
        rocrate_qual_file = _wait_for_download(RC_FILE_PATTERN, TIMEOUT_LONG)
        shutil.unpack_archive(rocrate_qual_file, extract_dir=os.path.join(DOWNLOAD_LOCATION, RC_EXTRACT_DIR))

    @staticmethod
    def _extract_image_from_pdf(pdf_filename, target_image_index, image_filename):
        """Extract an image from a PDF, saving it in a file"""
        _clear_download(image_filename)
        pdf_reader = PdfReader(pdf_filename)
        image_index = 0
        for page in pdf_reader.pages:
            for image_file_object in page.images:
                if image_index < target_image_index:
                    image_index += 1
                    continue
                image_file_object.image.save(image_filename)
                return image_file_object.data

        # If we get here, no image at this index was found, so return None to indicate this
        return None

    @staticmethod
    def _find_text_in_pdf(pdf_filename: str, match: str | re.Pattern[str], append_next_page=False) -> str | None:
        """Find where a text string or regex occurs in a PDF and returns the text of the page where it's found"""

        pdf_reader = PdfReader(pdf_filename)
        i_match = None
        text_match = None
        for i, page in enumerate(pdf_reader.pages):
            text = page.extract_text()
            if isinstance(match, str):
                if match in text:
                    i_match = i
                    text_match = text
                    break
            elif match.match(text):
                text_match = text
                break

        if i_match is None:
            return None
        elif not append_next_page:
            return text_match

        if i_match < len(pdf_reader.pages)-1:
            return text_match + pdf_reader.pages[i+1].extract_text()
        return text_match

    @staticmethod
    def _strip_tags(x: str):
        """Strip all HTML tags from a string"""
        last_x = ""
        while last_x != x:
            last_x = x
            x = re.sub(HTML_TAG_PATTERN, r"\1", x)
        return x

    @staticmethod
    def _html_to_md(x: str, strip_enclosing_tags=True):
        """Convert an HTML string to Markdown"""

        # If we're stripping enclosing tags (that is, tags that include the whole string), do that first
        if strip_enclosing_tags:
            while ENCLOSING_TAG_PATTERN.match(x):
                x = ENCLOSING_TAG_PATTERN.sub(r"\1", x)

        # First, sanitise any characters in the string which would be misinterpreted as MD syntax
        x = MD_SANITISE_PATTERN.sub(r"\1", x)

        # Then convert HTML markup to Markdown where the latter exists, or else remove it
        x = EM_TAG_PATTERN.sub("*", x)
        x = STRONG_TAG_PATTERN.sub("**", x)
        x = U_TAG_PATTERN.sub("", x)
        x = SUB_TAG_PATTERN.sub("~", x)
        x = SUP_TAG_PATTERN.sub("^", x)

        return x


class TestRoCrateMaximal(RoCrateContentsTester):
    """This class tests that an RO-Crate with all data filled in contains all the expected values"""

    fill_example = True

    def test_sens_table(self, driver: WebDriver):
        """Test that the sensitivity table in the RO-Crate data package is correct"""

        with open(RC_TABLE_QUAL_FILE) as fi:
            csv_reader = csv.reader(fi)
            l_condition_names = driver.find_elements(By.CSS_SELECTOR, ".condition-input p")
            l_yields = driver.find_elements(By.CSS_SELECTOR, "input.sample-value")
            l_deviations = driver.find_elements(By.CSS_SELECTOR, "input.rel-deviation-value")
            for i, row in enumerate(csv_reader):
                if i == 0:
                    # In the first row, check the header is as expected
                    assert row[0] == "Test parameter"
                    assert row[1] == "Isolated Yield (%)"
                    assert row[2] == "Deviation (%)"
                    continue

                elif i == 1:
                    # In the second row, check that we have the Standard Conditions info
                    assert row[0] == "Standard Conditions"
                    baseline_cell = driver.find_element(By.CSS_SELECTOR, "input.baseline-value")
                    assert row[1] == str(baseline_cell.get_property("value"))
                    assert row[2] == ""
                    continue

                # In subsequent rows, check the contents match what's entered in the table for each condition
                assert row[0] == l_condition_names[i-2].get_attribute("innerHTML")
                assert row[1] == str(l_yields[i-2].get_property("value"))
                assert row[2] == str(l_deviations[i-2].get_property("value"))
                continue

    def test_user_prefs(self, driver: WebDriver):
        """Test that the user preferences file in the RO-Crate data package is correct"""

        # The easiest way to check this is correct is to compare to a save file
        _clear_download(SAVE_QUAL_FILE)
        wait_for_element(driver, "//button[@id='save-data']").click()
        _wait_for_download(SAVE_QUAL_FILE)

        save_file = json.load(open(SAVE_QUAL_FILE))
        prefs_file = json.load(open(RC_PREF_QUAL_FILE))

        # Check that all the items in the preferences file match those in the save file
        # The save file will also contain the sensitivity table, but we don't need to worry about that
        for key, val in prefs_file.items():
            assert val == save_file[key]

    def test_plot(self, driver: WebDriver):
        """Test that the plot contained in the RO-Crate matches that shown on the page"""

        # Compare the plot to one downloaded to see if they're the same
        rocrate_plot = open(RC_PLOT_QUAL_FILE, "rb").read()

        _clear_download(PLOT_PNG_QUAL_FILE)
        wait_for_element(driver, "//button[@id='export-image-png']").click()
        _wait_for_download(PLOT_PNG_QUAL_FILE)

        downloaded_plot = open(RC_PLOT_QUAL_FILE, "rb").read()

        assert rocrate_plot == downloaded_plot

    def test_reaction_scheme(self):
        """Test that the reaction scheme cdxml file contained in the RO-Crate matches that uploaded by the user"""

        # Compare the file to the one in the example data to see if they're the same
        rocrate_scheme = open(RC_SCHEME_QUAL_FILE, "rb").read()
        example_scheme = open(EXAMPLE_CDXML, "rb").read()

        assert rocrate_scheme == example_scheme

    def test_reaction_image(self):
        """Test that the reaction image contained within the ESI.pdf file in the RO-Crate matches that uploaded by the
        user"""

        extracted_image_filename = os.path.join(DOWNLOAD_LOCATION, "extracted_scheme.png")
        self._extract_image_from_pdf(RC_ESI_QUAL_FILE, 0, extracted_image_filename)

        # The file gets slightly changed when embedded in the PDF, so we can test for an exact match. Instead we check
        # that the file size is close
        assert math.isclose(os.path.getsize(extracted_image_filename), os.path.getsize(EXAMPLE_PNG), rel_tol=0.1)

    def test_glorius_plot_image(self):
        """Test that the Glorius plot image contained within the ESI.pdf file in the RO-Crate matches that generated"""

        extracted_image_filename = os.path.join(DOWNLOAD_LOCATION, "extracted_plot.png")
        self._extract_image_from_pdf(RC_ESI_QUAL_FILE, 0, extracted_image_filename)

        # Since the file contained in the RO-Crate is checked to be correct in an above test, we compare with it here
        # The file gets slightly changed when embedded in the PDF, so we can test for an exact match. Instead we check
        # that the file size is close
        assert math.isclose(os.path.getsize(extracted_image_filename),
                            os.path.getsize(RC_PLOT_QUAL_FILE), rel_tol=0.1)

    def test_standard_conditions(self, driver: WebDriver):
        """Test that the provided standard conditions are provided in the RO-Crate in their own file and in the ESI.pdf
        file"""

        # Get the conditions text from the input on the page
        standard_conditions_input = driver.find_element(
            By.CSS_SELECTOR, "#rocrate-baseline-desc>div.ql-editor>p").get_property("innerHTML")

        # Read in the standard conditions file from the RO-Crate, and check that the input text is found in it
        standard_conditions_output_html = open(RC_STANDARD_COND_QUAL_FILE).read()
        assert standard_conditions_input in standard_conditions_output_html

        # Now check through the ESI.pdf file to find the standard conditions text. Start by looking for the heading
        # (the text "Standard Conditions" may appear elsewhere in the PDF, but only in this section heading should it
        # have a newline on either side)
        assert self._find_text_in_pdf(RC_ESI_QUAL_FILE, "\nStandard conditions\n")

        # Check that the text describing the standard conditions is found as well. This won't appear exactly due to
        # formatting differences, so we just look for the first few characters (before any formatting)
        sample_text = standard_conditions_input.split("<")[0][0:20]
        assert self._find_text_in_pdf(RC_ESI_QUAL_FILE, sample_text)

    def test_test_conditions(self, driver: WebDriver):
        """Test that the test conditions and their descriptions provided by the user are found in the applicable file
        and in the ESI.pdf file"""

        l_condition_names = driver.find_elements(By.CSS_SELECTOR, ".condition-input>.ql-editor>p")
        l_condition_descs = driver.find_elements(By.CSS_SELECTOR,
                                                 ".rocrate-cond-desc-input>.ql-editor>p")

        # Check the Test Conditions csv file first
        with open(RC_TEST_COND_QUAL_FILE) as fi:
            csv_reader = csv.reader(fi)
            for i, row in enumerate(csv_reader):
                if i == 0:
                    # In the first row, check the header is as expected
                    assert row[0] == "Test parameter"
                    assert row[1] == "Experimental conditions"
                    continue

                # In subsequent rows, check the contents match what's entered in the table for each condition
                assert row[0] == l_condition_names[i-1].get_attribute("innerHTML")
                assert row[1] == l_condition_descs[i-1].get_attribute("innerHTML")
                continue

        # Now check for it in the ESI.pdf file as well

        # Look for the heading of this section, and extract the text of the page it's on and the following page as well,
        # which should contain the full table
        pdf_text = self._find_text_in_pdf(RC_ESI_QUAL_FILE, "Preparation of sensitivity assessment of reaction",
                                          append_next_page=True)
        assert pdf_text
        for name, desc in zip(l_condition_names, l_condition_descs):
            assert self._strip_tags(name.get_attribute("innerHTML")) in pdf_text
            assert self._strip_tags(desc.get_attribute("innerHTML")) in pdf_text

    def test_title(self, driver: WebDriver):
        """Test that the provided title is present in the data package where expected"""

        # Get the title in HTML markup from the user input
        html_title = driver.find_element(
            By.CSS_SELECTOR, "#rocrate-title-input>.ql-editor>p").get_property("innerHTML")

        # Check for the title in the ESI.pdf file
        assert self._find_text_in_pdf(RC_ESI_QUAL_FILE, self._strip_tags(html_title)+"\n")

        # Check for it in the README.md file
        assert "## About\n\n**Title**: " + self._html_to_md(html_title, True) in open(RC_README_QUAL_FILE).read()

        # Check for it in the ro-crate-metadata.json file
        metadata_file = json.load(open(RC_METADATA_QUAL_FILE))
        assert metadata_file["@graph"][0]["name"] == self._strip_tags(html_title)

    def test_description(self, driver: WebDriver):
        """Test that the provided description is present in the data package where expected"""

        # Get the description in HTML markup from the user input
        html_desc = driver.find_element(
            By.CSS_SELECTOR, "#rocrate-desc-input>.ql-editor>p").get_property("innerHTML")

        # Check for it in the README.md file
        assert "\n\n**Description**: " + self._html_to_md(html_desc, True) in open(RC_README_QUAL_FILE).read()

        # Check for it in the ro-crate-metadata.json file
        metadata_file = json.load(open(RC_METADATA_QUAL_FILE))
        assert metadata_file["@graph"][0]["description"] == self._strip_tags(html_desc)

    def test_about(self, driver: WebDriver):
        """Test that the provided "About" text is present in the data package where expected"""

        # Get the about text in HTML markup from the user input
        html_about = driver.find_element(
            By.CSS_SELECTOR, "#rocrate-about>.ql-editor>p").get_property("innerHTML")

        # Check for it in the README.md file
        assert "\n\n**About**: " + self._html_to_md(html_about, True) in open(RC_README_QUAL_FILE).read()

    def test_license(self, driver: WebDriver):
        """Test that the provided license name and link are present in the data package where expected"""

        # Get the license name and description in HTML markup from the user input
        license_name: str = driver.find_element(By.CSS_SELECTOR, "#rocrate-license-name").get_property("value")
        license_url: str = driver.find_element(By.CSS_SELECTOR, "#rocrate-license-url").get_property("value")

        # Check for it in the README.md file
        assert ("**License:** [" + license_name + "](" + license_url + ")") in open(RC_README_QUAL_FILE).read()

        # Check for it in the ro-crate-metadata.json file
        metadata_file = json.load(open(RC_METADATA_QUAL_FILE))
        assert metadata_file["@graph"][0]["license"]["@id"] == license_url

    def test_contribs(self, driver: WebDriver):
        """Test that the provided author names and links are present in the RO-Crate where expected"""

        # Get lists of the author name and links
        l_contrib_names: list[str] = [x.get_property("value") for x in driver.find_elements(
            By.CSS_SELECTOR, ".rocrate-name-input")]
        l_contrib_orcids: list[str] = [x.get_property("value") for x in driver.find_elements(
            By.CSS_SELECTOR, ".rocrate-orcid-input")]

        # Load from the various sources where we'll be checking for author info
        esi_text = self._find_text_in_pdf(RC_ESI_QUAL_FILE, "Bibliographic Information\n", True)
        readme_text = open(RC_README_QUAL_FILE).read()
        l_metadata_authors = [x["@id"] for x in json.load(open(RC_METADATA_QUAL_FILE))["@graph"][0]["author"]]

        # Check that each author is present in each source
        for name, orcid in zip(l_contrib_names, l_contrib_orcids):

            # Get the link based on the ORCID
            link: str
            if not orcid.startswith("http"):
                link = "https://orcid.org/" + orcid
            else:
                link = orcid

            assert name in esi_text
            assert ("**Name**: [" + name + "](" + link + ")") in readme_text
            assert link in l_metadata_authors

    def test_contact(self, driver: WebDriver):
        """Test that the provided contact email is present in the data package where expected"""

        # Get the email from the user input
        email = driver.find_element(By.CSS_SELECTOR, "#rocrate-email-input").get_property("value")

        # Check for the title in the ESI.pdf file
        assert self._find_text_in_pdf(RC_ESI_QUAL_FILE, "Contact: " + email + ".\n")

        # Check for it in the README.md file
        assert "**Contact**: " + email in open(RC_README_QUAL_FILE).read()

    def test_citation(self, driver: WebDriver):
        """Test that the provided citation text is present in the data package where expected"""

        # Get the citation text from the user input
        citation: str = driver.find_element(By.CSS_SELECTOR,
                                            "#rocrate-citation>.ql-editor>p").get_property("innerHTML")

        # Check for the citation in the ESI.pdf file. Since we don't know exactly where linebreaks will be in it,
        # we just check for the first portion
        assert self._find_text_in_pdf(RC_ESI_QUAL_FILE, self._strip_tags(citation)[0:20])

        # Check for it in the README.md file
        assert self._html_to_md(citation) + "\n\n## File Structure" in open(RC_README_QUAL_FILE).read()


class TestRoCrateMinimal(RoCrateContentsTester):
    """This class tests that an RO-Crate without all data filled in will be missing elements that are only present when
    provided"""

    fill_example = False

    def test_reaction_scheme_absent(self):
        """Test that no reaction scheme file was found in the RO-Crate"""

        assert not os.path.isfile(RC_SCHEME_QUAL_FILE)

    def test_reaction_image_absent(self):
        """Test that no reaction scheme image was found in the RO-Crate"""

        # To ensure the reaction image isn't in the EDI.pdf file, we loop through it to extract all images and check
        # that none of them match the reaction image

        extracted_image_filename = os.path.join(DOWNLOAD_LOCATION, "extracted_scheme.png")

        i = 0
        while self._extract_image_from_pdf(RC_ESI_QUAL_FILE, i, extracted_image_filename):
            assert not math.isclose(os.path.getsize(extracted_image_filename),
                                    os.path.getsize(EXAMPLE_PNG), rel_tol=0.1)
            i += 1

    def test_standard_conditions_absent(self):
        """Test that the standard conditions file is not present in the output RO-Crate or ESI.pdf file"""

        assert not os.path.isfile(RC_STANDARD_COND_QUAL_FILE)

        # Now check through the ESI.pdf file to make sure we don'tfind the standard conditions text. There's no input
        # text to match here, so we just look for the heading (the text "Standard Conditions" may appear elsewhere in
        # the PDF, but only in this section heading should it have a newline on either side)
        assert not self._find_text_in_pdf(RC_ESI_QUAL_FILE, "\nStandard conditions\n")

    def test_test_conditions_absent(self):
        """Test that if no test condition descriptions are provided by the user, no file is made for them and no section
        is present in the ESI.pdf file"""

        # Check the Test Conditions csv file first
        assert not os.path.isfile(RC_TEST_COND_QUAL_FILE)

        # Check that the section isn't present in the ESI.pdf file
        assert not self._find_text_in_pdf(RC_ESI_QUAL_FILE, "Preparation of sensitivity assessment of reaction")


def _get_num_cond_desc_rows(driver: WebDriver):
    l_e = driver.find_elements(By.XPATH, "//tr[contains(@class,'rocrate-cond-row')]")
    return len(l_e)


def test_cond_desc_rows(driver: WebDriver):
    """Test that the number of condition description rows always matches the number of condition rows"""

    _init_rocrate_export(driver)

    # Check the number of rows is equal when initialised, and after a couple changes
    assert _get_num_condition_rows(driver) == _get_num_cond_desc_rows(driver)

    _set_num_condition_rows(driver, 7)
    assert _get_num_condition_rows(driver) == _get_num_cond_desc_rows(driver)

    _set_num_condition_rows(driver, 4)
    assert _get_num_condition_rows(driver) == _get_num_cond_desc_rows(driver)

    # Also check that if we change the rows before loading the RO-Crate export section, the number of description rows
    # is initialised correctly

    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)
    _set_num_condition_rows(driver, 8)
    _start_rocrate_export(driver)
    assert _get_num_condition_rows(driver) == _get_num_cond_desc_rows(driver)

    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)
    _set_num_condition_rows(driver, 3)
    _start_rocrate_export(driver)
    assert _get_num_condition_rows(driver) == _get_num_cond_desc_rows(driver)


def test_cond_desc_labels(driver: WebDriver):
    """Test that the condition description row labels all match the inputted condition values"""

    def _get_l_conds(driver: WebDriver):
        return driver.find_elements(
            By.XPATH, "//tr[contains(@class,'condition-row')]//div[contains(@class,'ql-editor')]//p")

    def _get_l_cond_descs(driver: WebDriver):
        return driver.find_elements(
            By.XPATH, "//tr[contains(@class,'rocrate-cond-row')]//div[contains(@class,'rocrate-cond-desc-label')]")

    def _check_labels_match(driver):
        l_conds = _get_l_conds(driver)
        l_cond_descs = _get_l_cond_descs(driver)

        for cond, cond_desc in zip(l_conds, l_cond_descs):
            assert cond.get_attribute('innerHTML').replace("<br>", "")+":" == cond_desc.get_attribute('innerHTML')

    # Start by checking that the labels are right with the example data

    _init_rocrate_export(driver, fill_example=True)
    _check_labels_match(driver)

    # Make a few changes to the number of conditions and the labels, and check that they still match up in the end

    # Add a condition row after index 1, and remove the condition row at index 3
    wait_for_element(driver, "//button[@id='add-cb-1']").click()
    wait_for_element(driver, "//button[@id='remove-cb-3']").click()

    # Check things match after these changes
    _check_labels_match(driver)

    # Edit the name of the newly-added condition, and check that the label is updated to match
    new_cond = _get_l_conds(driver)[2]
    scroll_element_into_view(driver, new_cond).click()
    send_keys(driver, "New description")
    _check_labels_match(driver)


def test_license_select(driver):
    """Test that selecting a license will result in its details appearing in the input boxes for it"""

    _init_rocrate_export(driver)

    def _check_license_info(name, link, disabled=True):
        name_input: WebElement = driver.find_element(value="rocrate-license-name")
        link_input: WebElement = driver.find_element(value="rocrate-license-url")
        assert name_input.get_attribute("value") == name
        assert link_input.get_attribute("value") == link
        if disabled:
            assert name_input.get_attribute("disabled") == 'true'
            assert link_input.get_attribute("disabled") == 'true'
        else:
            assert name_input.get_attribute("disabled") is None
            assert link_input.get_attribute("disabled") is None

    # Click on each license option in turn and check that the input text is correct
    wait_for_element(driver, "//input[@id='rocrate-license-none']").click()
    _check_license_info("", "")

    wait_for_element(driver, "//input[@id='rocrate-license-cc0']").click()
    _check_license_info("Creative Commons Zero v1.0 Universal",
                        "https://spdx.org/licenses/CC0-1.0.html")

    wait_for_element(driver, "//input[@id='rocrate-license-cc-by-4.0']").click()
    _check_license_info("Creative Commons Attribution 4.0 International",
                        "https://spdx.org/licenses/CC-BY-4.0.html")

    wait_for_element(driver, "//input[@id='rocrate-license-cc-by-sa-4.0']").click()
    _check_license_info("Creative Commons Attribution Share Alike 4.0 International",
                        "https://spdx.org/licenses/CC-BY-SA-4.0.html")

    wait_for_element(driver, "//input[@id='rocrate-license-other']").click()
    _check_license_info("", "", False)


def test_file_structure(driver: WebDriver):
    """Test that the File Structure section only shows elements that should be visible"""

    # Start with a minimal fill, which shouldn't show the optional elements
    _init_rocrate_export(driver)

    reaction_scheme_li = driver.find_element(value="rocrate-reaction-scheme-li")
    standard_cond_li = driver.find_element(value="rocrate-baseline-li")
    test_cond_li = driver.find_element(value="rocrate-test-conditions-li")

    with pytest.raises(MoveTargetOutOfBoundsException):
        scroll_element_into_view(driver, reaction_scheme_li)
    with pytest.raises(MoveTargetOutOfBoundsException):
        scroll_element_into_view(driver, standard_cond_li)
    with pytest.raises(MoveTargetOutOfBoundsException):
        scroll_element_into_view(driver, test_cond_li)

    # Now add data which should make them show up, and check that they are now visible
    _fill_example_data(driver)
    wait_for_element(driver, "//input[@id='rocrate-cdxml']").send_keys(EXAMPLE_CDXML)
    scroll_element_into_view(driver, reaction_scheme_li)
    scroll_element_into_view(driver, standard_cond_li)
    scroll_element_into_view(driver, test_cond_li)


def test_about_buttons(driver: WebDriver):
    """Test that the Default and Revert buttons in the "About this Dataset" section work as expected"""

    _init_rocrate_export(driver, fill_example=True)

    title_el = wait_for_element(driver,
                                "//div[@id='rocrate-title-input']//div[contains(@class,'ql-editor')]//p")
    desc_el = wait_for_element(driver,
                               "//div[@id='rocrate-desc-input']//div[contains(@class,'ql-editor')]//p")
    about_el = wait_for_element(driver,
                                "//div[@id='rocrate-about']//div[contains(@class,'ql-editor')]//p")

    # Save the current values, which are what the defaults should be when we click the button to use the defaults
    default_title = title_el.get_property("innerHTML")
    default_desc = desc_el.get_property("innerHTML")
    default_about = about_el.get_property("innerHTML")

    # Replace the input in each
    new_title = "Test title"
    title_el.click()
    send_keys(driver, Keys.BACKSPACE*100 + Keys.DELETE*100 + new_title)

    new_desc = "Test description"
    desc_el.click()
    send_keys(driver, Keys.BACKSPACE*100 + Keys.DELETE*100 + new_desc)

    new_about = "Test about"
    about_el.click()
    send_keys(driver, Keys.BACKSPACE*300 + Keys.DELETE*300 + new_about)

    def _check_info(ex_title, ex_desc, ex_about):
        assert title_el.get_property("innerHTML") == ex_title
        assert desc_el.get_property("innerHTML") == ex_desc
        assert about_el.get_property("innerHTML") == ex_about

    # Sanity check that the values we entered are now there
    _check_info(new_title, new_desc, new_about)

    # Click the "Use Defaults" button and check that the default values appear
    wait_for_element(driver, "//button[@id='rocrate-default-title-desc']").click()
    _check_info(default_title, default_desc, default_about)

    # Click the "Revert" button and check that the previous values appear
    revert_button = wait_for_element(driver, "//button[@id='rocrate-revert-title-desc']")
    revert_button.click()
    _check_info(new_title, new_desc, new_about)

    # Click the "Revert" button again, and check that the default values return
    revert_button.click()
    _check_info(default_title, default_desc, default_about)


def _get_num_contrib_rows(driver: WebDriver):
    l_e = driver.find_elements(By.XPATH, "//div[contains(@class,'rocrate-contrib-row')]")
    return len(l_e)


def _set_num_contrib_rows(driver: WebDriver, n: int):
    row_select_element = wait_for_element(driver, "//select[@id='num-contrib']")
    row_select = Select(row_select_element)
    wait_for_success(lambda: row_select.select_by_value(str(n)))


def test_num_contrib_control(driver: WebDriver):
    """Test that the number of contributors can be controlled by the selector and buttons"""

    _init_rocrate_export(driver, fill_example=True)

    # Check that we initially have 6 rows, as expected
    assert _get_num_contrib_rows(driver) == 6

    # Check that we can change the number of contrib rows with the select input
    _set_num_contrib_rows(driver, 8)
    assert _get_num_contrib_rows(driver) == 8
    _set_num_contrib_rows(driver, 4)
    assert _get_num_contrib_rows(driver) == 4

    # Check that we can add and remove rows with the buttons
    add_contrib_button_0 = wait_for_element(driver, "//button[@id='add-rcb-0']")
    add_contrib_button_0.click()
    add_contrib_button_0.click()
    add_contrib_button_0.click()
    assert _get_num_contrib_rows(driver) == 7
    wait_for_element(driver, "//button[@id='remove-rcb-2']").click()
    wait_for_element(driver, "//button[@id='remove-rcb-3']").click()
    assert _get_num_contrib_rows(driver) == 5


def test_bib_info_buttons(driver: WebDriver):
    """Test that the Default and Revert buttons in the "Bibliographic Info" section work as expected"""

    _init_rocrate_export(driver, fill_example=True)

    bib_el = wait_for_element(driver,
                              "//div[@id='rocrate-citation']//div[contains(@class,'ql-editor')]//p")

    # Save the current value - it's not the default in this case though
    init_bib = bib_el.get_property("innerHTML")

    # Replace the input
    new_bib = "Test bib"
    bib_el.click()
    send_keys(driver, Keys.BACKSPACE*300 + Keys.DELETE*300 + new_bib)

    # Sanity check that the value we entered is now there
    assert bib_el.get_property("innerHTML") == new_bib

    # Click the "Use Defaults" button and check that the default value appears and not the initial value
    wait_for_element(driver, "//button[@id='rocrate-default-citation']").click()
    default_bib = bib_el.get_property("innerHTML")
    assert default_bib != init_bib

    # To check that this does indeed appear to be the default value, we check that all the author names and plot title
    # appear in it
    l_contrib_rows = driver.find_elements(By.XPATH, "//div[contains(@class,'rocrate-contrib-row')]")
    for contrib_row in l_contrib_rows:
        contrib_name_el = contrib_row.find_element(By.XPATH, ".//input[contains(@class,'rocrate-name-input')]")
        contrib_surname = contrib_name_el.get_property("value").split(" ")[-1]
        assert contrib_surname in default_bib
    title_el = wait_for_element(driver,
                                "//div[@id='rocrate-title-input']//div[contains(@class,'ql-editor')]//p")
    assert title_el.get_property("innerHTML") in default_bib

    # Click the "Revert" button and check that the previous values appear
    revert_button = wait_for_element(driver, "//button[@id='rocrate-revert-citation']")
    revert_button.click()
    assert bib_el.get_property("innerHTML") == new_bib

    # Click the "Revert" button again, and check that the default values return
    revert_button.click()
    assert bib_el.get_property("innerHTML") == default_bib


def test_orcid_lookup(driver: WebDriver):
    """Test that we can use the ORCID Lookup button to search the ORCID site for a contributor"""

    _init_rocrate_export(driver, fill_example=True)
    original_window_handle = driver.current_window_handle

    # Find the entry in the contributors row for Frank Glorius, and click the ORCID Lookup button
    l_contrib_rows = driver.find_elements(By.XPATH, "//div[contains(@class,'rocrate-contrib-row')]")
    for contrib_row in l_contrib_rows:
        contrib_name_el = contrib_row.find_element(By.XPATH, ".//input[contains(@class,'rocrate-name-input')]")
        if not contrib_name_el.get_property("value") == "Frank Glorius":
            continue
        lookup_button = contrib_row.find_element(By.XPATH, ".//button[contains(@class,'rocrate-orcid-lookup')]")
        scroll_element_into_view(driver, lookup_button)
        lookup_button.click()
        break

    # Wait for the new tab to load, then switch to it
    WebDriverWait(driver, TIMEOUT_SHORT).until(EC.number_of_windows_to_be(2))
    new_window_handle = (set(driver.window_handles) - {original_window_handle}).pop()
    driver.switch_to.window(new_window_handle)
    assert driver.current_window_handle == new_window_handle

    # Wait for the search to finish
    wait_for_condition((lambda: len(driver.find_elements(
        By.XPATH, ".//td[contains(@class,'orcid-id-column')]//a")) > 0))

    l_orcid_cells = driver.find_elements(By.XPATH, ".//td[contains(@class,'orcid-id-column')]//a")
    EX_ORCID = "0000-0002-0648-956X"
    for orcid_cell in l_orcid_cells:
        if orcid_cell.get_property("innerHTML").strip() == EX_ORCID:
            break
    else:
        pytest.fail(f"Expected ORCID ({EX_ORCID}) for Frank Glorius not found in lookup")
