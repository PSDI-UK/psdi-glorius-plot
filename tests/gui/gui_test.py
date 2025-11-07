#!/usr/bin/env python

# Selenium test script for PSDI Glorius Plot Generator Service.

import os
import time
from multiprocessing import Process
from typing import Callable

import pytest

import psdi_glorius_plot

# Skip all tests in this module if required packages for GUI testing aren't installed
try:
    from selenium import webdriver
    from selenium.webdriver import FirefoxOptions
    from selenium.webdriver.common.action_chains import ActionChains
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


origin = os.environ.get("ORIGIN", DEFAULT_ORIGIN)


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

    driver_path = os.environ.get("HOME") + "/.wdm/drivers/geckodriver/linux64/v0.36.0/geckodriver"
    # driver_path = os.environ.get("DRIVER")

    if not driver_path:
        driver_path = GeckoDriverManager().install()
        print(f"Gecko driver installed to {driver_path}")

    opts = FirefoxOptions()
    opts.add_argument("--headless")
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
