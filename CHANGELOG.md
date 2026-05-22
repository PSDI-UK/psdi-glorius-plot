# Changelog for PSDI Glorius Plot Generator

## v0.4.7

### New and Changed Functionality

- The "Fill with example data" button will now also fill in the RO-Crate export section with example data corresponding to the same dataset

### Miscellaneous changes

- Added announcement bar that displays only on (likely) mobile devices warning that the site has not been fully tested on mobile

## v0.4.6

### Miscellaneous changes

- Restored link to project source repo on Documentation page

## v0.4.5

### Miscellaneous changes

- Reusable GitHub workflows now moved to be sourced from the common repo https://github.com/PSDI-UK/psdi-github-workflows-public

## v0.4.2

### Miscellaneous changes

- Previous location hosted on GitHub pages will now redirect to the new live location at https://organic-toolkit.psdi.ac.uk/glorius-plot

## v0.4.1

### Bugfixes

- When resizing the plot, the page arrangement won't update until size changes are complete, so that the input box won't move away from the mouse cursor between clicks

## v0.4.0

### Miscellaneous Changes

- Enabled analytics of how the page is used (for those users who consent):
  - How many visitors interact with the page in any way which promps a plot generation
  - How many users download the plot
  - How many users download an RO-crate data package

## v0.3.5

### New and Changed Functionality

- Temporarily removed header link to Organic Toolkit hub until that page goes live

## Bugfixes

- Fixed a bug where sub/superscript in the middle of a formatted text editor wouldn't apply to inserted symbols

## Documentation Changes

- Cleaned up misc. documentation and project metadata in preparation for public release

## v0.3.4

## Bugfixes

- Fixed issue where RO-crate data packages couldn't be exported if the user accessed the site through the /index.html alias
- Fixed issue where inserted symbols in formatted text editors wouldn't retain current formatting
- Fixed a couple runtime errors to instead exit silently
- Fixed formatting of symbol insertion buttons to appear as intended
- When mean/sample plotting mode is selected, the min/max output inputs will be disabled, since having them present but non-functional in this mode was confusing
- Fixed some formatting in generated README.md file in exported RO-Crate
- Changed all times in generated RO-Crate to be in user's local time
- When buttons are clicked to add or remove a contributor in the author list, the selection box will appropriately update

**Stylistic Changes**

- Adjusted labels for font size inputs on the plots and added clarifying tooltips

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
