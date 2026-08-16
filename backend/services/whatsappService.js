const axios = require("axios");


// =========================================================
// WHATSAPP CONFIGURATION
// =========================================================
//
// backend/.env
//
// WHATSAPP_ACCESS_TOKEN=...
// WHATSAPP_PHONE_NUMBER_ID=...
//
// Membership:
//
// WHATSAPP_TEMPLATE_NAME=membership_approved
// WHATSAPP_TEMPLATE_LANGUAGE=en
//
// Event:
//
// WHATSAPP_EVENT_TEMPLATE_NAME=event_booking_approved
// WHATSAPP_EVENT_TEMPLATE_LANGUAGE=en
//
// IMPORTANT:
//
// NEVER put WHATSAPP_ACCESS_TOKEN in the React frontend.
//
// =========================================================


// =========================================================
// NORMALIZE MOBILE NUMBER
// =========================================================

const normalizeMobile = (mobile) => {

  if (!mobile) {
    return null;
  }


  let value =
    String(mobile)
      .trim()
      .replace(/\D/g, "");


  // -------------------------------------------------------
  // Indian 10 digit number
  // -------------------------------------------------------

  if (value.length === 10) {

    value =
      "91" + value;

  }


  // -------------------------------------------------------
  // Indian number with leading 0
  // -------------------------------------------------------

  else if (
    value.startsWith("0") &&
    value.length === 11
  ) {

    value =
      "91" +
      value.substring(1);

  }


  // -------------------------------------------------------
  // Already contains Indian country code
  // -------------------------------------------------------

  else if (
    value.startsWith("91") &&
    value.length === 12
  ) {

    // Already valid.
    // Keep unchanged.

  }


  // -------------------------------------------------------
  // Invalid number
  // -------------------------------------------------------

  else {

    return null;

  }


  return value || null;

};


// =========================================================
// FORMAT DATE
// =========================================================

const formatDate = (value) => {

  if (!value) {
    return "-";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return String(value);

  }


  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );

};


// =========================================================
// GET WHATSAPP CONFIGURATION
// =========================================================
//
// Environment variables are read when the function is
// called instead of only when this module is imported.
//
// =========================================================

const getWhatsAppConfig = () => {

  const accessToken =
    String(
      process.env.WHATSAPP_ACCESS_TOKEN ||
      ""
    ).trim();


  const phoneNumberId =
    String(
      process.env.WHATSAPP_PHONE_NUMBER_ID ||
      ""
    ).trim();


  // -------------------------------------------------------
  // MEMBERSHIP TEMPLATE
  // -------------------------------------------------------

  const templateName =
    String(
      process.env.WHATSAPP_TEMPLATE_NAME ||
      "membership_approved"
    ).trim();


  const templateLanguage =
    String(
      process.env.WHATSAPP_TEMPLATE_LANGUAGE ||
      "en"
    ).trim();


  // -------------------------------------------------------
  // EVENT TEMPLATE
  // -------------------------------------------------------

  const eventTemplateName =
    String(
      process.env.WHATSAPP_EVENT_TEMPLATE_NAME ||
      "event_booking_approved"
    ).trim();


  const eventTemplateLanguage =
    String(
      process.env.WHATSAPP_EVENT_TEMPLATE_LANGUAGE ||
      "en"
    ).trim();


  return {

    accessToken,

    phoneNumberId,

    templateName,

    templateLanguage,

    eventTemplateName,

    eventTemplateLanguage,

  };

};


// =========================================================
// VALIDATE WHATSAPP CONFIGURATION
// =========================================================

const validateWhatsAppConfig = () => {

  const config =
    getWhatsAppConfig();


  if (!config.accessToken) {

    throw new Error(
      "WhatsApp API configuration is missing: WHATSAPP_ACCESS_TOKEN is not configured."
    );

  }


  if (!config.phoneNumberId) {

    throw new Error(
      "WhatsApp API configuration is missing: WHATSAPP_PHONE_NUMBER_ID is not configured."
    );

  }


  return config;

};


// =========================================================
// SEND MEMBERSHIP APPROVAL WHATSAPP
// =========================================================
//
// Used when:
//
// Membership approved
//
// OR:
//
// Admin clicks "Send WhatsApp"
//
// Template:
//
// membership_approved
//
// Variables:
//
// {{1}} Full Name
// {{2}} Membership Number
// {{3}} Plan
// {{4}} Amount
// {{5}} Start Date
// {{6}} Expiry Date
// {{7}} Verification URL
//
// =========================================================

const sendMembershipApprovalWhatsApp =
  async ({
    mobile,
    fullName,
    membershipNumber,
    planName,
    amount,
    startDate,
    expiryDate,
    verificationUrl,
  }) => {


    // =====================================================
    // LOAD CONFIG
    // =====================================================

    const {
      accessToken,
      phoneNumberId,
      templateName,
      templateLanguage,
    } =
      validateWhatsAppConfig();


    // =====================================================
    // NORMALIZE MOBILE
    // =====================================================

    const phone =
      normalizeMobile(
        mobile
      );


    if (!phone) {

      throw new Error(
        `Invalid member mobile number: ${
          mobile || "empty"
        }`
      );

    }


    // =====================================================
    // META GRAPH API URL
    // =====================================================

    const url =
      `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;


    // =====================================================
    // TEMPLATE PARAMETERS
    // =====================================================

    const parameters = [

      // {{1}} Full Name
      {
        type: "text",

        text:
          String(
            fullName ||
            "Member"
          ),
      },


      // {{2}} Membership Number
      {
        type: "text",

        text:
          String(
            membershipNumber ||
            "-"
          ),
      },


      // {{3}} Plan
      {
        type: "text",

        text:
          String(
            planName ||
            "Membership"
          ),
      },


      // {{4}} Amount
      {
        type: "text",

        text:
          `₹${Number(
            amount || 0
          ).toFixed(2)}`,
      },


      // {{5}} Start Date
      {
        type: "text",

        text:
          formatDate(
            startDate
          ),
      },


      // {{6}} Expiry Date
      {
        type: "text",

        text:
          formatDate(
            expiryDate
          ),
      },


      // {{7}} Verification URL
      {
        type: "text",

        text:
          String(
            verificationUrl ||
            "-"
          ),
      },

    ];


    // =====================================================
    // PAYLOAD
    // =====================================================

    const payload = {

      messaging_product:
        "whatsapp",

      recipient_type:
        "individual",

      to:
        phone,

      type:
        "template",

      template: {

        name:
          templateName,

        language: {

          code:
            templateLanguage,

        },

        components: [

          {

            type:
              "body",

            parameters,

          },

        ],

      },

    };


    // =====================================================
    // LOG
    // =====================================================
    //
    // NEVER log accessToken.
    //
    // =====================================================

    console.log(
      "Sending membership approval WhatsApp:",
      {
        phone,
        templateName,
        templateLanguage,
        membershipNumber:
          membershipNumber || "-",
      }
    );


    // =====================================================
    // SEND
    // =====================================================

    try {

      const response =
        await axios.post(
          url,
          payload,
          {

            headers: {

              Authorization:
                `Bearer ${accessToken}`,

              "Content-Type":
                "application/json",

            },

            timeout:
              15000,

          }
        );


      const messageId =
        response
          ?.data
          ?.messages?.[0]
          ?.id ||
        null;


      console.log(
        "Membership approval WhatsApp sent successfully.",
        {
          messageId,
          phone,
          membershipNumber,
        }
      );


      return {

        sent:
          true,

        status:
          "sent",

        messageId,

        error:
          null,

        response:
          response.data,

      };

    } catch (error) {

      const apiError =
        error
          ?.response
          ?.data;


      const apiMessage =
        apiError
          ?.error
          ?.message ||
        error?.message ||
        "Unknown WhatsApp API error";


      console.error(
        "Membership WhatsApp API error:",
        {
          message:
            apiMessage,

          code:
            apiError?.error?.code ||
            null,

          type:
            apiError?.error?.type ||
            null,

          traceId:
            apiError?.error?.fbtrace_id ||
            null,

          response:
            apiError ||
            null,
        }
      );


      return {

        sent:
          false,

        status:
          "failed",

        messageId:
          null,

        error:
          apiMessage,

        response:
          apiError ||
          null,

      };

    }

  };


// =========================================================
// SEND EVENT BOOKING APPROVAL WHATSAPP
// =========================================================
//
// Used when:
//
// Event payment verified
//        ↓
// Booking confirmed
//        ↓
// Event pass generated
//        ↓
// WhatsApp notification
//
// Template:
//
// event_booking_approved
//
// Variables:
//
// {{1}} Full Name
// {{2}} Booking Code
// {{3}} Event Name
// {{4}} Event Date
// {{5}} Event Time
// {{6}} Venue
// {{7}} Event Mode
// {{8}} Amount
// {{9}} Pass Code
//
// =========================================================

const sendEventBookingApprovalWhatsApp =
  async ({
    mobile,
    fullName,
    bookingCode,
    eventTitle,
    eventDate,
    startTime,
    endTime,
    venue,
    eventMode,
    amount,
    passCode,
  }) => {


    // =====================================================
    // LOAD CONFIG
    // =====================================================

    const {
      accessToken,
      phoneNumberId,
      eventTemplateName,
      eventTemplateLanguage,
    } =
      validateWhatsAppConfig();


    // =====================================================
    // NORMALIZE MOBILE
    // =====================================================

    const phone =
      normalizeMobile(
        mobile
      );


    if (!phone) {

      throw new Error(
        `Invalid event participant mobile number: ${
          mobile || "empty"
        }`
      );

    }


    // =====================================================
    // META GRAPH API URL
    // =====================================================

    const url =
      `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;


    // =====================================================
    // EVENT TIME
    // =====================================================

    const formattedStartTime =
      startTime
        ? String(startTime).substring(0, 5)
        : "-";


    const formattedEndTime =
      endTime
        ? String(endTime).substring(0, 5)
        : "";


    const formattedTime =
      formattedEndTime
        ? `${formattedStartTime} - ${formattedEndTime}`
        : formattedStartTime;


    // =====================================================
    // TEMPLATE PARAMETERS
    // =====================================================

    const parameters = [

      // {{1}} Full Name
      {
        type: "text",

        text:
          String(
            fullName ||
            "Participant"
          ),
      },


      // {{2}} Booking Code
      {
        type: "text",

        text:
          String(
            bookingCode ||
            "-"
          ),
      },


      // {{3}} Event Name
      {
        type: "text",

        text:
          String(
            eventTitle ||
            "Event"
          ),
      },


      // {{4}} Event Date
      {
        type: "text",

        text:
          formatDate(
            eventDate
          ),
      },


      // {{5}} Event Time
      {
        type: "text",

        text:
          formattedTime,
      },


      // {{6}} Venue
      {
        type: "text",

        text:
          String(
            venue ||
            "-"
          ),
      },


      // {{7}} Event Mode
      {
        type: "text",

        text:
          String(
            eventMode ||
            "-"
          ),
      },


      // {{8}} Amount
      {
        type: "text",

        text:
          `₹${Number(
            amount || 0
          ).toFixed(2)}`,
      },


      // {{9}} Pass Code
      {
        type: "text",

        text:
          String(
            passCode ||
            "-"
          ),
      },

    ];


    // =====================================================
    // PAYLOAD
    // =====================================================

    const payload = {

      messaging_product:
        "whatsapp",

      recipient_type:
        "individual",

      to:
        phone,

      type:
        "template",

      template: {

        name:
          eventTemplateName,

        language: {

          code:
            eventTemplateLanguage,

        },

        components: [

          {

            type:
              "body",

            parameters,

          },

        ],

      },

    };


    // =====================================================
    // LOG
    // =====================================================

    console.log(
      "Sending event booking approval WhatsApp:",
      {
        phone,
        templateName:
          eventTemplateName,
        templateLanguage:
          eventTemplateLanguage,
        bookingCode:
          bookingCode || "-",
      }
    );


    // =====================================================
    // SEND TO META
    // =====================================================

    try {

      const response =
        await axios.post(
          url,
          payload,
          {

            headers: {

              Authorization:
                `Bearer ${accessToken}`,

              "Content-Type":
                "application/json",

            },

            timeout:
              15000,

          }
        );


      const messageId =
        response
          ?.data
          ?.messages?.[0]
          ?.id ||
        null;


      console.log(
        "Event booking approval WhatsApp sent successfully.",
        {
          messageId,
          phone,
          bookingCode,
        }
      );


      return {

        sent:
          true,

        status:
          "sent",

        messageId,

        error:
          null,

        response:
          response.data,

      };

    } catch (error) {

      const apiError =
        error
          ?.response
          ?.data;


      const apiMessage =
        apiError
          ?.error
          ?.message ||
        error?.message ||
        "Unknown WhatsApp API error";


      console.error(
        "Event booking WhatsApp API error:",
        {
          message:
            apiMessage,

          code:
            apiError?.error?.code ||
            null,

          type:
            apiError?.error?.type ||
            null,

          traceId:
            apiError?.error?.fbtrace_id ||
            null,

          response:
            apiError ||
            null,
        }
      );


      return {

        sent:
          false,

        status:
          "failed",

        messageId:
          null,

        error:
          apiMessage,

        response:
          apiError ||
          null,

      };

    }

  };


// =========================================================
// WHATSAPP CONFIGURATION STATUS
// =========================================================
//
// This function can be used for debugging.
//
// It NEVER returns the actual access token.
//
// =========================================================

const getWhatsAppConfigurationStatus =
  () => {

    const {
      accessToken,
      phoneNumberId,
      templateName,
      templateLanguage,
      eventTemplateName,
      eventTemplateLanguage,
    } =
      getWhatsAppConfig();


    return {

      configured:
        Boolean(
          accessToken &&
          phoneNumberId
        ),


      accessTokenConfigured:
        Boolean(
          accessToken
        ),


      phoneNumberIdConfigured:
        Boolean(
          phoneNumberId
        ),


      membershipTemplate:
        templateName,


      membershipTemplateLanguage:
        templateLanguage,


      eventTemplate:
        eventTemplateName,


      eventTemplateLanguage:
        eventTemplateLanguage,

    };

  };


// =========================================================
// EXPORT
// =========================================================

module.exports = {

  sendMembershipApprovalWhatsApp,

  sendEventBookingApprovalWhatsApp,

  getWhatsAppConfigurationStatus,

};