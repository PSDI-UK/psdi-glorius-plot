import "https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.1.0/dist/cookieconsent.umd.js";

// Value in sessionStorage to track state of cookie consent
sessionStorage["analyticsAllowed"] = false;

/**
 * Get whether or not the user consents for analytics to be collected
 * @returns {boolean}
 */
export function getAnalyticsAllowed() {
  return sessionStorage["analyticsAllowed"];
}

CookieConsent.run({

  categories: {
    necessary: {
      enabled: true,  // this category is enabled by default
      readOnly: true  // this category cannot be disabled
    },
    analytics: {
      enabled: true
    }
  },

  language: {
    default: "en",
    translations: {
      en: {
        consentModal: {
          title: "Cookie consent",
          description: "In order to assess how much various PSDI services are used and to better improve them, " +
            "we use analytics cookies to anonymously track user engagements.",
          acceptAllBtn: "Accept all",
          acceptNecessaryBtn: "Reject all",
          showPreferencesBtn: "Manage individual preferences"
        },
        preferencesModal: {
          title: "Manage individual preferences",
          acceptAllBtn: "Accept all",
          acceptNecessaryBtn: "Reject all",
          savePreferencesBtn: "Accept current selection",
          closeIconLabel: "Close",
          sections: [
            {
              title: "Strictly Necessary Cookies",
              description: "These cookies are essential for the proper functioning of the website and cannot be " +
                "disabled.",
              linkedCategory: "necessary"
            },
            {
              title: "Performance and Analytics",
              description: "These cookies collect information about how you use our website. All of the data is " +
                "anonymized and cannot be used to identify you. This data will aid us in assessing how much this " +
                "service and aspects of it are used and in improving it.",
              linkedCategory: "analytics"
            },
            {
              title: "More information",
              description: "For any queries in relation to our policy on cookies and your choices, please " +
                "contact us at <a href='mailto:support@psdi.ac.uk'>support@psdi.ac.uk</a>"
            }
          ]
        }
      }
    }
  },
  onConsent: function () {
    if (CookieConsent.acceptedCategory('analytics')) {
      sessionStorage["analyticsAllowed"] = true;
    } else {
      sessionStorage["analyticsAllowed"] = false;
    }
  },
  onChange: function ({ changedCategories, changedServices }) {
    if (changedCategories.includes('analytics')) {
      if (CookieConsent.acceptedCategory('analytics')) {
        sessionStorage["analyticsAllowed"] = true;
      } else {
        sessionStorage["analyticsAllowed"] = false;
      }
    }
  }
});