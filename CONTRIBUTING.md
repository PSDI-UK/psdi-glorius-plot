# Contributing

This file contains information for people working on developing or maintaining this project, explaining the project structure, procedures used, and other information likely to be useful.

## Git Workflow

This project uses a version of [GitLab Flow](https://about.gitlab.com/topics/version-control/what-is-gitlab-flow/) for its workflow. This uses two primary long-lived branches, `main` and `release`, plus short-lived feature and release candidate branches:

- `main` - This is the default and main working branch of the project. Day-to-day changes start from this branch and are merged back into it when ready. `main` is protected so that it can only be merged to via Pull Request.
- `release` - This is the branch that is used for deployments and publication of the project. It is periodically updated by a release candidate branch being created from `main`, tested, and merged into this when approved. `release` is protected so that it can only be merged to via Pull Request.
- Feature branches - These are used for day-to-day work. Feature branches are branched off of `main` and then worked on (usually by a single developer). They may be discarded if it's decided they are unneeded, or else if they're approved, they're merged back into `main` via a Pull Request. To avoid issues which can arise from feature branches being open too long and diverging from `main`, it is a good idea to aim for each to only represent a small, discrete change. A good target is approximately one day's worth of work, and only exceptionally should a feature branch be open for more than a week. The recommended naming convention for feature branches is `feature-<description-of-change>`, e.g. `feature-new-thing`. A GitHub workflow is set up to automatically create a PR into `main` for each feature branch created which follows this convention.
- Release candidate branches - These branches are used to bridge `main` and `release`. When it's time to prepare for a release, a release candidate branch is branched off of `main` to isolate it from any further changes. It then undergoes full testing, including manual testing of the web app. If any issues are identified which require fixing, the branch can be updated until all tests pass. Once this is the case, the branch is merged into `release` as well as back into `main` (so that any fixes made in it are also reflected there). The recommended naming convention for release candidate branches is `rc-<target-version-number>`, e.g. `rc-0.1.4`. A GitHub workflow is set up to automatically create a PR into `release` for each release candidate branch created which follows this convention.

## Release Checklist and Procedure

The following tasks should be completed before merging a release candidate branch to `release`:

- Determine the target version based on the changes made:

  - If any breaking changes have been made (after version 1.0.0), the version will advance to the next major version - `X.Y.Z` to `(X+1).0.0`
  - Otherwise, if any features are added, or any breaking changes are made before version 1.0.0, the version will advance to the next minor version - `X.Y.Z` to `X.(Y+1).0`.
  - Otherwise, the version will advance to the next bugfix version - `X.Y.Z` to `X.Y.(Z+1)`.

- Create a release candidate branch with the name `rc-<target-version>` (e.g. `rc-1.2.3`), branched off of `main`. This should trigger an automated workflow to create a Pull Request from this branch to `release`. You may wish to edit the PR's name and/or description.

- Tagging of the release is handled by an automated workflow which determines the new version based on the previous version and the commit history, looking for any commits which indicate a feature addition or breaking change using [Angular convention](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular#commit-message-format). Since we don't practice this regularly, you'll need to make a commit with this style to indicate any feature additions or breaking changes (this can be done when updating the version in the next step):

  - If there are any breaking changes **after version 1.0.0 is first published**, start the commit's first line with "feat(release): ", followed by a brief description of the release in a single line, then a blank line, then start the third line with "BREAKING CHANGE: ", followed by a description of the breaking change(s). Use manual newlines if necessary to keep lines in this description to a maximum of 50 characters. E.g.:

    ```
    feat(release): Remove deprecated Functionality

    BREAKING CHANGE: Deprecated functions X, Y, and Z
    are now removed, in favor of new functions I, J,
    and K. Also added new feature Q and fixed bugs R
    and S
    ```

  - Otherwise, if there are any new features added, or breaking changes before version 1.0.0 is first published, do as above, except without "BREAKING CHANGE: " starting the third line, e.g.:

    ```
    feat(release): Added new feature X

    Also fixed bugs Y and Z
    ```

  - Otherwise, no special formatting is needed for a commit - the workflow will default to assuming a bugfix version incrementation when it doesn't see one of the two patterns above.

- Check that the project version is updated to the desired new version in all places it appears:

  - `CHANGELOG.md` (The top section should reflect the new version)

- Update the release date at the top of `README.md`

- Ensure that all automated tests and checks pass - these should be run automatically on the PR opened above

- Manually test the web interface. At this stage, it should be deployed to dev at https://PROJECT_NAME_HYPHEN-dev.psdi.ac.uk/ (requires VPN to access), and it can be run locally as well

  - If there have been any changes to the Python backend, run a test that a file can be converted successfully and produces a proper log
  - If there have been any changes to the web frontend, check the appearance of the site to ensure that it looks as desired. Test the Accessibility page to ensure that changes there work properly, are saved when requested and apply to other pages

- Check that `CHANGELOG.md` is up-to-date with all changes in this version (including any fixes found to be necessary in the testing above). Any subsections for categories with no changes in this version can be removed to keep the file concise

If any of these tasks fail and require changes, make the needed changes and then recheck that all other tasks still pass. E.g. if testing the local web interface reveals a bug in the Python backend that needs to be fixed, ensure that all automated tests still pass after doing so

Then, follow the following steps to make the release:

1. Merge the pull request to `release`. The release candidate branch can be safely deleted. This should trigger an automated pipeline to tag, publish, and deploy and the new code.
2. After the above pipeline finishes, confirm that the changes are shown live on the staging site at https://PROJECT_NAME_HYPHEN-staging.psdi.ac.uk/ by checking the version shown at the bottom of the Documentation page. If necessary, double-check that nothing has broken due to the slight changes in appearance between the dev and staging sites
3. Manually trigger the `Manual Trigger - Deploy to production cluster` workflow on the `release` branch to deploy the site from the staging to release environment, which will make the changes visible to users
4. After completion of the workflow, confirm that the changes are live on the production site at https://PROJECT_NAME_HYPHEN.psdi.ac.uk/ by checking the version shown at the bottom of the Documentation page
5. Merge `release` into `main` via PR (obviously don't delete `release` - if it even gives you the option to, something has gone wrong in the project rulesets, so report this).

## Changelog

`CHANGELOG.md` should be used to keep a record of notable changes to the project. Trivial changes such as fixing typos, formatting, and minor refactoring (e.g. changing the name of a variable) do not need to be recorded. These changes should be sorted into appropriate sections as described below:

- **Breaking Changes:** Any changes which would result in previous integration with this project breaking and no longer being compatible with the new version (e.g. a command-line option is removed)

- **Deprecated Features:** Any features which are planned to be removed or changed in a breaking way in a future release (e.g. a command-line option will be removed soon, and perhaps an alternative way to achieve the same goal already exists)

- **New and Changed Functionality:** Anything new the project can do for the user

- **Bugfixes:** Any issues fixed

- **Testing Changes:** New unit tests or significant changes to existing tests, not including any incidental updates to tests which are necessary for other features already noted. E.g. if a test is implemented to ensure that a bugfix noted in this section works properly, that doesn't need to be noted

- **Documentation Changes:** Any notable updates to `README.md`, `CONTRIBUTING.md`, docstrings, and comments. This doesn't need to include incidental changes - for instance, if a new command-line option is added, it isn't necessary to make a separate note that documentation for it is added. However, if documentation was previously missing for an option and is now added, that should be noted

- **Formatting and Refactoring Changes:** Any notable non-functional changes to the code (e.g. "Changed all python variables to `snake_case`", "Refactored set of separate functions to use the same common code")

- **Stylistic Changes:** Non-functional changes to the aesthetic appearance of the web app or the formatting of text displayed to the user by the CLI (including logs)

- **Miscellaneous Changes:** Anything that doesn't fit into one of the above categories, such as project meta changes (e.g. "Implemented new GitHub workflow to lint JavaScript code")

A new section should be added to the CHANGELOG after each release, which can be temporarily named e.g. "Since v1.2.3" (the last release) until it is known whether the next release will increment the major, minor, or bugfix number in the version. As part of the release, this section should be renamed to the target version.

The below can be used as a template for new sections to be added to the Changelog with each new release. When a release is made, any sections without any entries can be removed to help keep the file concise:

```
## Since v...

### Breaking Changes

-

### Deprecated Features

-

### New and Changed Functionality

-

### Bugfixes

-

### Testing Changes

-

### Documentation Changes

-

### Formatting and Refactoring Changes

-

### Stylistic Changes

-

### Miscellaneous Changes

-

```

## Editing Advice

### Debugging

For debugging python issues, it's recommended to install the package in editable mode via pip. This sets it up so that the python source files are used in-place rather than copied to a separate install directory, meaning that changes to them will be reflected in runs without need for a new installation. This can be done through the following command (which also installs all optional packages):

```bash
pip install --editable .'[gui-test]'
```

### Running Unit Tests

The GUI unit tests require a web driver to be installed, and will install one if one isn't. To avoid repeated unnecessary API calls for the installation, you can set the environmental variable `DRIVER` when running tests to the location of your driver. This can be set to be automatically picked up by many IDEs by setting this in a `.env` file in the root of your project, e.g.:

```
DRIVER=~/.wdm/drivers/geckodriver/linux64/v0.36.0/geckodriver
```

To get the address of your driver, you can run the following in a Python terminal from within this projects virtual environment (after installing the `[gui-test]` optional dependencies):

```python
from webdriver_manager.firefox import GeckoDriverManager
driver_path = GeckoDriverManager().install()
print(f"Gecko driver installed to: {driver_path}")
```

## Continuous Integration

This project uses various GitHub workflows to perform Continuous Integration tasks. These can be found in the `.github/workflows` folder. The files which start with "ci-" are the directly-triggered workflows, and the files which start with "job-" are reusable workflows called by the former. These workflows handle the following tasks:

- Testing and scanning (triggered by pushes to `main`, `release`, `feature*`, and `rc*` branches)
- Periodic checks for updates to common assets
- Automatic creation of pull requests for `feature*` and `rc*` branches
- Automatic tagging, publishing, and deployment of the `main` and `release` branches to the development, staging and production environments

See the comments within the files for further details. See also the [section on deployment](#deployment) for details specific to deployment tasks.

## Publishing

The Python library, CLI, and local GUI are published as a Python package via PyPI. This section describes how the package is set up and how it's published.

### Package Setup

The package's setup is defined in the `pyproject.toml` file. This defines the project's metadata as well as necessary information for its build system.

The package uses [Hatch](https://hatch.pypa.io/latest/) for its build backend, as it is simpler to configure than the classic [Setuptools](https://setuptools.pypa.io/en/latest/userguide/) and provides some useful extensibility.

The version of the package is set to be determined from the version control system, meaning on the release branch, the version will always match the latest tag. This alleviates us of having to manually maintain the version for the package to keep it correct, but does result in some quirks. It's a bit fussier to set up (though that's done now), and it makes the user take an extra step if they want to install from source but haven't cloned the repository - this is noted in the installation instructions in the README.

### Initial Publication

This section details the procedure for the initial publication of this package.

First, it's necessary to install a couple required packages in order to build a Python package: `build` to build it and `twine` to upload it. These can be installed with pip via:

```bash
pip install --upgrade build twine
```

Alternatively, your system may require installing them via its package manager, e.g. via:

```bash
sudo apt install python3-build twine
```

First, test building the project to ensure that it's build correctly and includes the correct files. This can be done through:

```bash
python -m build
```

This will create a directory "dist" which contains two files: a tarball of the package source, and a compiled wheel. Inspect the tarball (e.g. with `tar tf dist/filename.tar.gz`) to confirm that it contains the desired files.

To upload, follow [this tutorial](https://packaging.python.org/en/latest/tutorials/packaging-projects/#uploading-the-distribution-archives), which first walks through a test upload to TestPyPI, and then provides the changes necessary to upload to PyPI proper.

### Publishing Updates

The `ci-release.yml` workflow is planned to publish any new releases to PyPI after the initial publication. This can be set up by uncommenting the relevant lines in this file, possibly updating the `job-publish-pypi.yml` to enable this (testing will be necessary), and setting up Trusted Publishing for the project on PyPI (see [guide](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-pypi))

### Project Management

This project is published on PyPI at https://pypi.org/project/PROJECT_NAME_HYPHEN/ and on TestPyPI at https://test.pypi.org/project/PROJECT_NAME_HYPHEN/. Maintainers can manage the project through the "Manage" link on that page or from their own projects page.

The most important setting to be aware of here is Publishing -> Trusted Publisher Management. This is the system used to allow automatic publishing of releases from GitHub. It's set up so that the current project, organisation, environment, and workflow for publishing are approved. If any of these change, this will need to be updated by adding a new trusted publisher with the new settings (on both PyPI and TestPyPI) and removing the old one.

The management page can also be used to add or remove collaborators through the Collaborators tab. Generally the project on these sites doesn't require much maintenance, but at least a few active collaborators should be on it at all times to avoid getting locked out if someone is suddenly unavailable.

## Deployment

The `ci-main.yml`, `ci-release.yml` and `manual-deploy-production.yml` files in the `.github/workflows` directory house workflows which deploy
the service to [Kubernetes](https://kubernetes.io/) clusters hosted in STFC. There are three clusters, each of which correspond
to a different deployment _environment_ for the service. The three environments are `development`, `staging` and `production`.
Deployment to `development`, `staging` and `production` is done from either the `main` or `release` branch. The table below indicates which
branch deploys to which environment. The table also shows, for each environment:

- the URL on which the service is exposed once it is successfully deployed
- the accessibility of the service. Depending on the environment the service is either accessible to the _public_ at the specified URL,
  or accessible only to IP addresses within the _STFC and University of Southampton subnets_
- the trigger used to invoke the workflow which deploys the service from the source branch. Deployment is either _automatic_
  upon a commit to the source branch which passes the unit-tests job; or results from a _manual_ invocation of a workflow by a
  developer.

| Environment   | URL                                            | Accessibility                              | Source branch | Deployment trigger |
| ------------- | ---------------------------------------------- | ------------------------------------------ | ------------- | ------------------ |
| `development` | https://PROJECT_NAME_HYPHEN-dev.psdi.ac.uk     | STFC and University of Southampton subnets | `main`        | Automatic          |
| `staging`     | https://PROJECT_NAME_HYPHEN-staging.psdi.ac.uk | STFC and University of Southampton subnets | `release`     | Automatic          |
| `production`  | https://PROJECT_NAME_HYPHEN.psdi.ac.uk         | public                                     | `release`     | Manual             |

Thus the `main` is automatically deployed to the `development` environment, and the `release` branch is automatically deployed to the `staging`
environment. However deployment from the `release` branch to the `production` environment is a manual process. This is to allow developers to
manually check that the `release` version works correctly in the `staging` environment before deploying it to the `production` environment.
The checks to `staging` before deployment to `production` should echo those described in the above
section [Release Checklist and Procedure](#release-checklist-and-procedure).

### How to deploy to the `production` environment

To trigger the workflow which deploys the service to the `production` environment, from the [main page of the repo](https://github.com/PSDI-UK/PROJECT_NAME_HYPHEN)
navigate to [Actions](https://github.com/PSDI-UK/PROJECT_NAME_HYPHEN/actions). Here you should see on the right a list of recent workflow
runs, including whether or not they are successful (as indicated by a green tick); and on the left you should see a list of all workflows.

The workflow which deploys the `release` branch to the `staging` environment is named `CI - Release`. As mentioned above, you should verify
that this workflow successfully deployed the `release` version to `staging` before considering deploying to `production`. If you click on the
latest workflow run of `CI - Release` then you can see a breakdown of the workflow into its constituent workflows. Note the `deploy-stfc-staging-k8s`
job. If this job is successful then the `release` version has been successfully deployed to `staging`.

Assuming this is the case, navigating back to [Actions](https://github.com/PSDI-UK/PROJECT_NAME_HYPHEN/actions), note that there is a workflow
listed on the left named `Manual Trigger - Deploy to production cluster`. This is the workflow which must be invoked manually to deploy the `release`
version to the `production` environment. Clicking on the link to this workflow gives
[a list of recent invocations](https://github.com/PSDI-UK/PROJECT_NAME_HYPHEN/actions/workflows/manual-deploy-production.yml) of the workflow.
Moreover, a light blue banner appears which says `This workflow has a workflow_dispatch event trigger` on the left and has a `Run workflow` button
on the right. To invoke the workflow, press this button, _select the `release` branch_ as the option for `Use workflow from` dropdown menu, and
then finally click the green `Run workflow` button. Once the workflow has been invoked you should be able to see its progress in real time on the
same page.

### Further technical details

The `ci-main.yml`, `ci-release.yml` and `ci-deploy-production.yml` workflows leverage the `job-deploy-k8s.yml` callable workflow to do the heavy
lifting with regards to deployment to STFC Kubernetes environments. The `job-deploy-k8s.yml` workflow is coded to be invoked on PSDI's GitHub
runners. These runners are hosted within STFC's network, providing a means to access the three STFC Kubernetes clusters corresponding to the
`development`, `staging` and `production` environments. The environment to be targeted for deployment is passed to the `job-deploy-k8s.yml`
workflow as an input parameter. Given a target environment `<env>`, the `job-deploy-k8s.yml` workflow will deploy the service to the
the `<env>` environment using the Kubernetes manifests stored in the `deploy`/<env>` directory of this repository.

The workflow relies on several repository secrets, namely `KUBECONF`, `IMAGEPULLSECRET`, `CERTIFICATE_PRIVATE_KEY` and `CERTIFICATE_PEM` for
various purposes.

- `KUBECONF` provides Kubernetes-specific information pertaining to the the Kubernetes cluster for the target environment. Note that
  `KUBECONF` is an _environment_-dependent secret, taking different values for each of the environments.
- `IMAGEPULLSECRET` enables the container image housing the service to be pulled from this GitHub repo to the PSDI runner
- `CERTIFICATE_PRIVATE_KEY` and `CERTIFICATE_PEM` pertain to the TLS certificates for the service
  For further information see the `job-deploy-k8s.yml` file and aforementioned Kubernetes manifests.

The server can be configured by editing the environmental variables set in `Dockerfile`.
