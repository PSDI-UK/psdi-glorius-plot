#!/usr/bin/env python

# Selenium test script for PSDI Glorius Plot Generator Service.

import math
import os
import time
from collections.abc import Callable
from multiprocessing import Process

import pytest

import psdi_glorius_plot

# Skip all tests in this module if required packages for GUI testing aren't installed
try:
    from selenium import webdriver
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

DOWNLOAD_LOCATION = "/tmp"
EX_PLOT_FILENAME = "glorius_plot.png"

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
    scroll_element_into_view(driver, abs_radio)
    abs_radio.click()
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
    scroll_element_into_view(driver, mean_radio)
    mean_radio.click()
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
    scroll_element_into_view(driver, rel_radio)
    rel_radio.click()
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
    width_input.send_keys(Keys.BACKSPACE*10 + Keys.DELETE*10 + str(x))
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
    height_input.send_keys(Keys.BACKSPACE*10 + Keys.DELETE*10 + str(x))
    # Click the plot so that the height input is defocused and an update will be triggered
    wait_for_element(driver, "//canvas[@id='glorius-plot']").click()


def _get_plot_fontsize(driver: WebDriver):
    fontsize_input: WebElement = driver.find_element(By.XPATH, "//input[@id='font-size-input']")
    return float(fontsize_input.get_attribute("value"))


def test_plot_sizing(driver: WebDriver):
    """Test that we can resize the plot properly"""

    # Load the home page and wait for the page cover to be removed
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

    init_plot_width = 600
    init_plot_height = 600
    init_plot_fontsize = 18

    # Check that the plot has the correct initial dimensions and fontsize
    assert _get_plot_width(driver) == init_plot_width
    assert _get_plot_height(driver) == init_plot_height
    assert _get_plot_fontsize(driver) == init_plot_fontsize

    # By default, the aspect ratio should stay fixed, but the font size won't scale. Confirm that this works

    scale = 2
    _set_plot_width(driver, init_plot_width*scale)

    assert _get_plot_width(driver) == init_plot_width*scale
    assert _get_plot_height(driver) == init_plot_height*scale
    assert _get_plot_fontsize(driver) == init_plot_fontsize

    scale = 0.5
    _set_plot_height(driver, init_plot_height*scale)

    assert _get_plot_width(driver) == init_plot_width*scale
    assert _get_plot_height(driver) == init_plot_height*scale
    assert _get_plot_fontsize(driver) == init_plot_fontsize

    # Reset the plot and check it resets properly
    reset_plot_dims_button = wait_for_element(driver, "//button[@id='reset-plot-dims']")
    reset_plot_dims_button.click()

    assert _get_plot_width(driver) == init_plot_width
    assert _get_plot_height(driver) == init_plot_height
    assert _get_plot_fontsize(driver) == init_plot_fontsize

    # Now try turning off aspect ratio lock, and test that height doesn't scale with width and vice-versa
    aspect_ratio_lock_box = wait_for_element(driver, "//input[@id='lock-aspect-ratio']")
    aspect_ratio_lock_box.click()

    width_scale = 1.5
    _set_plot_width(driver, init_plot_width*width_scale)

    assert _get_plot_width(driver) == init_plot_width*width_scale
    assert _get_plot_height(driver) == init_plot_height
    assert _get_plot_fontsize(driver) == init_plot_fontsize

    height_scale = 0.75
    _set_plot_height(driver, init_plot_height*height_scale)

    assert _get_plot_width(driver) == init_plot_width*width_scale
    assert _get_plot_height(driver) == init_plot_height*height_scale
    assert _get_plot_fontsize(driver) == init_plot_fontsize

    # Now let's test font size scaling. Turn back on aspect ratio lock, turn on font scaling, and reset the plot dims

    scroll_element_into_view(driver, aspect_ratio_lock_box)
    aspect_ratio_lock_box.click()
    scale_font_size_box = wait_for_element(driver, "//input[@id='scale-font-size']")
    scale_font_size_box.click()
    scroll_element_into_view(driver, reset_plot_dims_button)
    reset_plot_dims_button.click()

    scale = 2
    _set_plot_width(driver, init_plot_width*scale)
    assert _get_plot_fontsize(driver) == init_plot_fontsize*scale

    scale = 0.5
    _set_plot_height(driver, init_plot_height*scale)
    assert _get_plot_fontsize(driver) == init_plot_fontsize*scale


def test_fan_plot_controls(driver: WebDriver):
    """Test that toggling fan plot mode makes the radar-plot-specific controls disappear"""

    # Load the home page and wait for the page cover to be removed
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

    # Check that the radar plot controls are all present initially
    grid_line_toggle = wait_for_element(driver, "//input[@id='grid-line-toggle']")
    axis_line_toggle = wait_for_element(driver, "//input[@id='axis-line-toggle']")

    # Toggle fan plot mode, then check the radar-plot-specific elements are no longer present
    wait_for_element(driver, "//input[@id='fan-toggle']").click()
    with pytest.raises(MoveTargetOutOfBoundsException):
        scroll_element_into_view(driver, grid_line_toggle)
    with pytest.raises(MoveTargetOutOfBoundsException):
        scroll_element_into_view(driver, axis_line_toggle)


def _wait_for_download(filename):
    time_elapsed = 0
    while not os.path.isfile(filename):
        time.sleep(TIMESTEP)
        time_elapsed += TIMESTEP
        if time_elapsed > TIMEOUT_SHORT:
            pytest.fail(f"Download of {filename} and timed out")


def test_download_plot(driver: WebDriver):
    """Test that we can download an image of the plot using the provided button"""

    qualified_download_filename = os.path.join(DOWNLOAD_LOCATION, EX_PLOT_FILENAME)

    # If the downloaded file already exists, remove it
    try:
        os.remove(qualified_download_filename)
    except FileNotFoundError:
        pass

    # Load the home page and wait for the page cover to be removed
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

    # Wait a moment after the page loads so the plot can be generated
    time.sleep(PLOT_GENERATION_TIME)

    # Turn off auto-updating while we do this
    wait_for_element(driver, "//input[@id='auto-update-toggle']").click()

    download_button = wait_for_element(driver, "//button[@id='export-image-png']")
    download_button.click()
    _wait_for_download(qualified_download_filename)

    # Note the filesize of the downloaded plot, then delete it
    empty_plot_filesize = os.path.getsize(qualified_download_filename)
    os.remove(qualified_download_filename)

    # Add a title to the plot now, so we can test if they seem to appear on the downloaded plot

    title_input_element = driver.find_element(By.XPATH,
                                              "//*[@id='title-input']//*[contains(@class,'ql-editor')]")
    title_input_element.send_keys("Example very very very very very long title")

    # Generate it again, using the button to manually re-generate (since auto-updates are turned off)
    generate_plot_button = wait_for_element(driver, "//button[@id='generate-plot']")
    generate_plot_button.click()
    time.sleep(PLOT_GENERATION_TIME)

    # Download it again
    scroll_element_into_view(driver, download_button)
    download_button.click()
    _wait_for_download(qualified_download_filename)

    # Note the filesize of the new downloaded plot, then delete it as well
    title_plot_filesize = os.path.getsize(qualified_download_filename)
    os.remove(qualified_download_filename)

    # Check that the file size of the plot with the title is larger than for the empty plot - due to how PNG enconding
    # works, a more complicated image will have a larger file size. If this isn't the case, it indicates something is
    # going wrong with generating the plot
    assert title_plot_filesize > empty_plot_filesize

    # Add labels to plot now, so we can test if they seem to appear on the downloaded plot

    l_label_input_elements = driver.find_elements(By.XPATH,
                                                  "//*[contains(@class,'condition-input')]" +
                                                  "//*[contains(@class,'ql-editor')]")
    for label_input_element in l_label_input_elements:
        label_input_element.send_keys("Label")

    # Generate it again, using the button to manually re-generate (since auto-updates are turned off)
    generate_plot_button = wait_for_element(driver, "//button[@id='generate-plot']")
    generate_plot_button.click()
    time.sleep(PLOT_GENERATION_TIME)

    # Download it again
    scroll_element_into_view(driver, download_button)
    download_button.click()
    _wait_for_download(qualified_download_filename)

    # Note the filesize of the new downloaded plot, then delete it as well
    label_plot_filesize = os.path.getsize(qualified_download_filename)
    os.remove(qualified_download_filename)

    # Check that the file size of the plot with the labels is now even larger than just the title
    assert label_plot_filesize > title_plot_filesize

    # Now, fill the table with example data, wait for the plot to be re-generated, and download again
    wait_for_element(driver, "//button[@id='fill-example']").click()
    assert wait_for_condition(lambda: _get_num_condition_rows(driver) == 10)
    scroll_element_into_view(driver, generate_plot_button)
    generate_plot_button.click()
    time.sleep(PLOT_GENERATION_TIME)

    scroll_element_into_view(driver, download_button)
    download_button.click()
    _wait_for_download(qualified_download_filename)

    # Note the filesize of the new downloaded plot, then delete it as well
    example_plot_filesize = os.path.getsize(qualified_download_filename)
    os.remove(qualified_download_filename)

    # Check that the file size of the example plot is even larger than the labeled plot, since it's even more
    # complicated
    assert example_plot_filesize > label_plot_filesize
