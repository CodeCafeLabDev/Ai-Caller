const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateJWT } = require('../middleware/auth');

// Get all plans
router.get("/", (req, res) => {
  db.query("SELECT * FROM plans", (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch plans", error: err });
    }
    res.json({ success: true, data: results });
  });
});

// Get a single plan by id
router.get("/:id", (req, res) => {
  db.query("SELECT * FROM plans WHERE id = ?", [req.params.id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch plan", error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }
    res.json({ success: true, data: results[0] });
  });
});

// Create a new plan
router.post("/", (req, res) => {
  const plan = req.body;
  delete plan.id;
  db.query("INSERT INTO plans SET ?", plan, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to create plan", error: err });
    }
    db.query("SELECT * FROM plans WHERE id = ?", [result.insertId], (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Plan created but failed to fetch", error: err });
      }
      res.status(201).json({ success: true, message: "Plan created", data: results[0] });
    });
  });
});

// Update a plan
router.put("/:id", (req, res) => {
  const planId = Number(req.params.id);
  const updatedPlan = req.body;

  db.query("SELECT * FROM plans WHERE id = ?", [planId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch current plan data", error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const currentPlan = results[0];
    const updateFields = {
      name: updatedPlan.name !== undefined ? updatedPlan.name : currentPlan.name,
      description: updatedPlan.description !== undefined ? updatedPlan.description : currentPlan.description,
      priceMonthly: updatedPlan.priceMonthly !== undefined ? updatedPlan.priceMonthly : currentPlan.priceMonthly,
      priceAnnual: updatedPlan.priceAnnual !== undefined ? updatedPlan.priceAnnual : currentPlan.priceAnnual,
      currency: updatedPlan.currency !== undefined ? updatedPlan.currency : currentPlan.currency,
      durationDays: updatedPlan.durationDays !== undefined ? updatedPlan.durationDays : currentPlan.durationDays,
      totalCallsAllowedPerMonth: updatedPlan.totalCallsAllowedPerMonth !== undefined ? updatedPlan.totalCallsAllowedPerMonth : currentPlan.totalCallsAllowedPerMonth,
      callDurationPerCallMaxMinutes: updatedPlan.callDurationPerCallMaxMinutes !== undefined ? updatedPlan.callDurationPerCallMaxMinutes : currentPlan.callDurationPerCallMaxMinutes,
      numberOfAgents: updatedPlan.numberOfAgents !== undefined ? updatedPlan.numberOfAgents : currentPlan.numberOfAgents,
      agentsAllowed: updatedPlan.agentsAllowed !== undefined ? updatedPlan.agentsAllowed : currentPlan.agentsAllowed,
      voicebotUsageCap: updatedPlan.voicebotUsageCap !== undefined ? updatedPlan.voicebotUsageCap : currentPlan.voicebotUsageCap,
      apiAccess: updatedPlan.apiAccess !== undefined ? updatedPlan.apiAccess : currentPlan.apiAccess,
      customAgents: updatedPlan.customAgents !== undefined ? updatedPlan.customAgents : currentPlan.customAgents,
      reportingAnalytics: updatedPlan.reportingAnalytics !== undefined ? updatedPlan.reportingAnalytics : currentPlan.reportingAnalytics,
      liveCallMonitor: updatedPlan.liveCallMonitor !== undefined ? updatedPlan.liveCallMonitor : currentPlan.liveCallMonitor,
      overagesAllowed: updatedPlan.overagesAllowed !== undefined ? updatedPlan.overagesAllowed : currentPlan.overagesAllowed,
      overageChargesPer100Calls: updatedPlan.overageChargesPer100Calls !== undefined ? updatedPlan.overageChargesPer100Calls : currentPlan.overageChargesPer100Calls,
      trialEligible: updatedPlan.trialEligible !== undefined ? updatedPlan.trialEligible : currentPlan.trialEligible,
      status: updatedPlan.status !== undefined ? updatedPlan.status : currentPlan.status,
    };

    db.query("UPDATE plans SET ? WHERE id = ?", [updateFields, planId], (err, result) => {
      if (err) {
        console.error("Database error updating plan:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to update plan",
          error: err.message,
        });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Plan not found" });
      }
      db.query("SELECT * FROM plans WHERE id = ?", [planId], (err, results) => {
        if (err) {
          console.error("Error fetching updated plan:", err);
          return res.status(500).json({
            success: false,
            message: "Plan updated but failed to fetch updated data",
            error: err.message,
          });
        }
        res.json({
          success: true,
          message: "Plan updated successfully",
          data: results[0],
        });
      });
    });
  });
});

// Delete a plan
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM plans WHERE id = ?", [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to delete plan", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }
    res.json({ success: true, message: "Plan deleted" });
  });
});

module.exports = router;