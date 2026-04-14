# Changelog for PSDI Glorius Plot Generator

## v0.3.4

## Bugfixes

- Fixed issue where RO-crate data packages couldn't be exported if the user accessed the site through the /index.html alias

## v0.3.0

### New and Changed Functionality

- Enabled .svg output
- Added button to formatted text toolbar to insert special symbols

### Stylistic Changes

- Reworked layout to better take use of available screen space on various screen widths
- Implemented new PSDI dark mode styling (auto-enabled if the user's system prefers dark mode)

### Miscellaneous Changes

- Enabled deployment to STFC-hosted infrastructure

## v0.2.2

### Bugfixes

- Fixed "Contact" link in page header to correct email address
- Another fix for functionality for setting a custom deployment directory

## v0.2.1

### Bugfixes

- Fixed functionality for setting a custom deployment directory

### Miscellaneous Changes

- Changed workflows to use GitHub's runners

## v0.2.0

### New and Changed Functionality

- Added functionality requested for initial release, including advanced plot configuration and RO-crate output

### Miscellaneous Changes

- Enabled publication to GitHub Pages

## v0.1.0

MVP release. Included features:

- Generate a radar plot from provided data
- Ability to input deviation % directly in table
- Expandable rows and columns in table (columns providing different outputs to be plotted)
- Colored background rings in plots
- Plot can be saved by screenshot or by right-clicking and saving the image
