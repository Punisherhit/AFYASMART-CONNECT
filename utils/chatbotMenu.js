// Button-based menus
exports.faqMenu = {
  text: "What do you need help with?",
  buttons: [
    { title: "Book Appointment", payload: "BOOK_APPOINTMENT" },
    { title: "Doctor Availability", payload: "DOCTOR_AVAILABILITY" },
    { title: "Prescription Help", payload: "PRESCRIPTION_HELP" }
  ]
};

exports.appointmentTypes = {
  text: "Select appointment type:",
  buttons: [
    { title: "In-Person", payload: "APPOINTMENT_IN_PERSON" },
    { title: "Telemedicine", payload: "APPOINTMENT_TELE" }
  ]
};

// Quick Replies (text suggestions)
exports.quickReplyMenu = {
  text: "Need help? Try:",  // <-- This is your new addition
  quickReplies: ["Book Appointment", "Cancel Visit", "Prescription Status"]
};