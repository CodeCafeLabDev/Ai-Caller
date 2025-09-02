const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateJWT } = require('../middleware/auth');

// Assign a plan to a client (POST /api/assigned-plans)
router.post("/", (req, res) => {
  console.log("Assign Plan Request Body:", req.body);
  const {
    client_id,
    plan_id,
    start_date,
    duration_override_days,
    is_trial,
    discount_type,
    discount_value,
    notes,
    auto_send_notifications
  } = req.body;

  const sql = `
    INSERT INTO assigned_plans
    (client_id, plan_id, start_date, duration_override_days, is_trial, discount_type, discount_value, notes, auto_send_notifications, is_enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `;

  db.query(
    sql,
    [
      client_id,
      plan_id,
      start_date ? new Date(start_date) : null,
      duration_override_days || null,
      is_trial || false,
      discount_type || null,
      discount_value || null,
      notes || null,
      auto_send_notifications || false
    ],
    (err, result) => {
      if (err) {
        console.error("Failed to assign plan:", err);
        return res.status(500).json({ success: false, message: "Failed to assign plan", error: err });
      }

      // Turn off trial mode when a plan is assigned
      db.query(
        "UPDATE clients SET trialMode = FALSE, trialDuration = NULL, trialCallLimit = NULL, trialEndsAt = NULL WHERE id = ?",
        [client_id],
        (err3) => {
          if (err3) {
            console.error("Failed to turn off trial mode:", err3);
          } else {
            console.log(`✅ Trial mode automatically turned off for client ${client_id} after plan assignment`);
          }

          if (auto_send_notifications) {
            // Fetch client and the specific plan just assigned
            db.query(
              `SELECT c.companyName, c.contactPersonName, c.companyEmail, p.name AS planName
               FROM clients c
               JOIN plans p ON p.id = ?
               WHERE c.id = ?`,
              [plan_id, client_id],
              async (err4, results) => {
                if (!err4 && results && results.length > 0) {
                  const rec = results[0];
                  try {
                    const { sendEmail } = require('../services/emailService');
                    const planData = {
                      companyName: rec.companyName,
                      contactPersonName: rec.contactPersonName,
                      companyEmail: rec.companyEmail,
                      planName: rec.planName || 'Selected Plan',
                      startDate: start_date ? new Date(start_date).toLocaleDateString() : new Date().toLocaleDateString(),
                      durationOverrideDays: duration_override_days,
                      discountType: discount_type,
                      discountValue: discount_value
                    };
                    await sendEmail(rec.companyEmail, 'planAssignmentEmail', planData);
                    console.log(`📧 Plan assignment email sent to ${rec.companyEmail}`);
                  } catch (emailError) {
                    console.error("Failed to send plan assignment email:", emailError);
                  }
                }
                res.status(201).json({ success: true, message: "Plan assigned successfully and trial mode turned off" });
              }
            );
          } else {
            res.status(201).json({ success: true, message: "Plan assigned successfully and trial mode turned off" });
          }
        }
      );
    }
  );
});

// Toggle enable/disable of a specific assigned plan (PATCH /api/assigned-plans/:assignmentId/enable)
router.patch('/:assignmentId/enable', (req, res) => {
  const assignmentId = req.params.assignmentId;
  const { is_enabled } = req.body;
  const val = (is_enabled === 0 || is_enabled === false) ? 0 : 1;
  
  db.query('UPDATE assigned_plans SET is_enabled = ? WHERE id = ?', [val, assignmentId], (err, result) => {
    if (err) {
      // If column missing, create it on the fly and retry once
      if (String(err.code) === 'ER_BAD_FIELD_ERROR') {
        db.query("ALTER TABLE assigned_plans ADD COLUMN IF NOT EXISTS is_enabled TINYINT(1) NOT NULL DEFAULT 1 AFTER auto_send_notifications", (altErr) => {
          if (altErr) {
            console.error('Failed to add assigned_plans.is_enabled column:', altErr);
            return res.status(500).json({ success: false, message: 'Failed to add is_enabled column', error: altErr });
          }
          db.query('UPDATE assigned_plans SET is_enabled = ? WHERE id = ?', [val, assignmentId], (retryErr, retryResult) => {
            if (retryErr) {
              console.error('Retry failed updating is_enabled:', retryErr);
              return res.status(500).json({ success: false, message: 'Failed to update plan state after migration', error: retryErr });
            }
            if (retryResult.affectedRows === 0) {
              return res.status(404).json({ success: false, message: 'Assigned plan not found' });
            }
            return res.json({ success: true });
          });
        });
        return;
      }
      console.error('Failed to update assigned plan enable state:', err);
      return res.status(500).json({ success: false, message: 'Failed to update plan state', error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Assigned plan not found' });
    }
    res.json({ success: true });
  });
});

// Delete a specific assigned plan (DELETE /api/assigned-plans/:assignmentId)
router.delete("/:assignmentId", (req, res) => {
  const assignmentId = req.params.assignmentId;
  db.query("DELETE FROM assigned_plans WHERE id = ?", [assignmentId], (err, result) => {
    if (err) {
      console.error("Failed to delete assigned plan:", err);
      return res.status(500).json({ success: false, message: "Failed to delete assigned plan", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Assigned plan not found" });
    }
    res.json({ success: true, message: "Assigned plan removed" });
  });
});

module.exports = router;
