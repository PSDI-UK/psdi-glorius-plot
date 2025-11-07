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
    from selenium.webdriver.remote.errorhandler import MoveTargetOutOfBoundsException
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

    driver_path = os.environ.get("DRIVER")

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


def scroll_element_into_view(driver: WebDriver, e: EC.WebElement):
    driver.execute_script("arguments[0].scrollIntoView();", e)
    wait_for_success(lambda: ActionChains(driver).move_to_element(e).perform())


def wait_for_element(driver: WebDriver | EC.WebElement,
                     xpath: str,
                     root: EC.WebElement | None = None,
                     by=By.XPATH) -> EC.WebElement:
    """Shortcut for boilerplate to wait until a web element is visible"""

    if root is None:
        root = driver

    WebDriverWait(root, TIMEOUT_LONG).until(EC.presence_of_element_located((by, xpath)))
    e = root.find_element(by, xpath)

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

    WebDriverWait(root, TIMEOUT_LONG).until(EC.element_to_be_clickable((by, xpath)))

    return e


async def wait_for_condition(cond: Callable, timeout=TIMEOUT_SHORT) -> bool:
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


async def wait_for_success(action: Callable, timeout=TIMEOUT_SHORT):
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
    assert wait_for_element(driver, "//header//h5").text == "Glorius Plot Generator"


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
    scroll_element_into_view(driver, outcome_select_element)
    wait_for_success(lambda: outcome_select.select_by_value("Spectroscopic Yield (%)"))

    scroll_element_into_view(driver, outcome_column_label)
    assert wait_for_condition(lambda: outcome_column_label.text == "Spectroscopic Yield (%)")
