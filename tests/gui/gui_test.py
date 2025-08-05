#!/usr/bin/env python

# Selenium test script for PSDI Reaction Sensitivity Radar Plot Generator Service.

import os
import time
from multiprocessing import Process

import pytest

import psdi_reaction_radar

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
    from selenium.webdriver.support.ui import WebDriverWait
    from webdriver_manager.firefox import GeckoDriverManager

    from psdi_reaction_radar.gui.setup import start_app

except ImportError:
    # We put the importorskip commands here rather than above so that standard imports can be used by static analysis
    # tools where possible, and the importorskip is used here so pytest will stop processing immediately if things can't
    # be imported - pytest.mark.skip won't do that
    pytest.importorskip("Flask")
    pytest.importorskip("selenium")
    pytest.importorskip("webdriver_manager.firefox")

DEFAULT_ORIGIN = "http://127.0.0.1:5000"

# Standard timeout at 10 seconds
TIMEOUT = 10


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
    os.chdir(os.path.join(psdi_reaction_radar.__path__[0], ".."))

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
    WebDriverWait(root, TIMEOUT).until(EC.invisibility_of_element((By.XPATH, "//div[@id='cover']")))


def wait_for_element(driver: WebDriver | EC.WebElement,
                     xpath: str,
                     root: EC.WebElement | None = None,
                     by=By.XPATH) -> EC.WebElement:
    """Shortcut for boilerplate to wait until a web element is visible"""

    if root is None:
        root = driver

    WebDriverWait(root, TIMEOUT).until(EC.element_to_be_clickable((by, xpath)))
    e = root.find_element(by, xpath)

    # Scroll the element into view
    def scroll_into_view():
        driver.execute_script("arguments[0].scrollIntoView();", e)
        ActionChains(driver).move_to_element(e).perform()

    # Some elements might take some time to load into place, so we loop for a bit to give them a chance to do so if we
    # can't immediately do so
    time_elapsed = 0
    while time_elapsed < TIMEOUT:
        try:
            scroll_into_view()
            break
        except MoveTargetOutOfBoundsException:
            time_elapsed += 1
            time.sleep(1)

    return e


def test_initial_frontpage(driver: WebDriver):
    """A basic unit test that checks that the front page is displayed with the expected content"""

    # Load the home page and wait for the page cover to be removed
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

    # Check that the front page contains the header "PSDI Reaction Sensitivity Radar Plot Generator".

    element = wait_for_element(driver, "//header//h5")
    assert element.text == "PSDI Reaction Sensitivity Radar Plot Generator"
