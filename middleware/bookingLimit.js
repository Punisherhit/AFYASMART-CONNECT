const checkDailyLimit = async (req, res, next) => {
  const { date } = req.body;
  const approvedCount = await Appointment.countDocuments({ 
    date, 
    status: 'Approved' 
  });

  if (approvedCount >= 5) {
    return res.status(400).json({ 
      error: "No slots available for this date. Please choose another day." 
    });
  }
  next();
};

// Use in routes:
router.post('/', checkDailyLimit, appointmentController.create);