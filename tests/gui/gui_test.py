#!/usr/bin/env python

# Selenium test script for PSDI Glorius Plot Generator Service.

import math
import os
import re
import shutil
import sys
import time
from collections.abc import Callable
from multiprocessing import Process

import pytest

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


# Constants related to downloaded files and RO-Crate structure
DOWNLOAD_LOCATION = "/tmp"
PLOT_PNG_FILE, PLOT_PNG_QUAL_FILE = _local_and_qual("glorius_plot.png", DOWNLOAD_LOCATION)
PLOT_SVG_FILE, PLOT_SVG_QUAL_FILE = _local_and_qual("glorius_plot.svg", DOWNLOAD_LOCATION)

SAVE_FILE = "glorius_plot_data.json"

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


def scroll_element_into_view(driver: WebDriver, e: WebElement):
    driver.execute_script("arguments[0].scrollIntoView({behavior: 'instant', block: 'center'});", e)
    wait_for_success(lambda: ActionChains(driver).move_to_element(e).perform())
    return e


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


def test_initial_frontpage(driver: WebDriver):
    """A basic unit test that checks that the front page is displayed with the expected content"""

    # Load the home page and wait for the page cover to be removed
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

    # Check that the front page contains expected elements

    # Check page title is present with the correct text
    assert (wait_for_element(driver, "//header//h5")).text == "Glorius Plot Generator"


def test_outcome_select(driver: WebDriver):
    """Test that the outcome can be changed to produce desired effects - showing/hiding custom input, updating text
    of coloumn in table, etc.
    """

    # Load the home page and wait for the page cover to be removed
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

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

    # Load the home page and wait for the page cover to be removed
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

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

    # Load the home page and wait for the page cover to be removed
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

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

    # Load the home page and wait for the page cover to be removed
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

    def _send_keys(keys: str, shift: bool = False):
        if not shift:
            ActionChains(driver).send_keys(keys).perform()
        else:
            ActionChains(driver).key_down(Keys.SHIFT).send_keys(keys).key_up(Keys.SHIFT).perform()

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

    # Load the home page and wait for the page cover to be removed
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

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

    # Load the home page and wait for the page cover to be removed
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

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

    # Load the home page and wait for the page cover to be removed
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

    # Toggle fan plot mode, checking that nothing goes wrong when we do so
    fan_select_element = wait_for_element(driver, "//select[@id='fan-select']")
    fan_select = Select(fan_select_element)

    wait_for_success(lambda: fan_select.select_by_value("fan"))
    wait_for_success(lambda: fan_select.select_by_value("radar"))


def test_plot_sizing(driver: WebDriver):
    """Test that we can resize the plot properly"""

    # Load the home page and wait for the page cover to be removed
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

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

    found_filename: str = ""

    while not file_exists or new_filesize == 0 or new_filesize != last_filesize:

        # Check if the file exists, checking differently depending on if we're doing a regex match or not
        file_exists = False
        if isinstance(filename, str):
            file_exists = os.path.isfile(filename)
            found_filename = filename
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


def test_download_plot(driver: WebDriver):
    """Test that we can download an image of the plot using the provided button"""

    # If the downloaded files already exists, remove them
    _clear_download(PLOT_PNG_QUAL_FILE, PLOT_SVG_QUAL_FILE)

    # Load the home page and wait for the page cover to be removed
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

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
    wait_for_element(driver, "//button[@id='fill-example']").click()
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

    # Load the home page and wait for the page cover to be removed
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

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
    fill_example_button = wait_for_element(driver, "//button[@id='fill-example']")
    fill_example_button.click()
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

    scroll_element_into_view(driver, fill_example_button).click()
    with pytest.raises(NoAlertPresentException):
        Alert(driver).text


def test_save_load_data(driver: WebDriver):
    """Test that we can save and load data entered in the plot"""

    qualified_save_filename = os.path.join(DOWNLOAD_LOCATION, SAVE_FILE)

    # If the save file already exists, remove it
    _clear_download(qualified_save_filename)

    # Load the home page and wait for the page cover to be removed
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

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
    _wait_for_download(qualified_save_filename)

    # Overwrite the data by filling with example data
    fill_example_button = wait_for_element(driver, "//button[@id='fill-example']")
    fill_example_button.click()
    alert = Alert(driver)
    assert "Do you want to proceed?" in alert.text
    alert.accept()

    # Wait a moment for the example data to be filled
    time.sleep(PLOT_GENERATION_TIME)

    # Now load the saved data
    wait_for_element(driver, "//input[@id='load-data-file']").send_keys(qualified_save_filename)
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

    # Load the home page and wait for the page cover to be removed
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

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

    # Load the home page and wait for the page cover to be removed
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

    _clear_downloaded_rocrate()

    if fill_example:
        wait_for_element(driver, "//button[@id='fill-example']").click()

    _start_rocrate_export(driver)


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

    rocrate_qual_file = _wait_for_download(RC_FILE_PATTERN)

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

    wait_for_element(driver, "//button[@id='rocrate-download']").click()

    # Clear the previous download and download again
    _clear_downloaded_rocrate()
    wait_for_element(driver, "//button[@id='rocrate-download']").click()
    rocrate_qual_file = _wait_for_download(RC_FILE_PATTERN)

    # Try extracting the file to check that expected files exist/don't exist in it
    shutil.unpack_archive(rocrate_qual_file, extract_dir=os.path.join(DOWNLOAD_LOCATION, RC_EXTRACT_DIR))

    # This is a maximal RO-Crate, so all files should be present
    for file in L_RC_MANDATORY_FILES + L_RC_OPTIONAL_FILES:
        assert os.path.exists(file), f"Expected file/dir {file} not found in ROCrate data package"

    assert _validate_rocrate_file(rocrate_qual_file), f"RO-Crate file {rocrate_qual_file} failed validation"
