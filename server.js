//server.js
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require('bcrypt');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

console.log("🟡 Starting backend server...");

const app = express();
app.use(cors());
app.use(express.json());

// DB config
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "ai-caller",
  multipleStatements: true // Allow multiple statements
});

// Connect to DB
db.connect(err => {
  if (err) {
    console.error("❌ Database connection failed:", err.stack);
    // Try to create database and table if they don't exist
    const tempDb = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: ""
    });

    tempDb.connect(err => {
      if (err) {
        console.error("Failed to create temporary connection:", err);
        return;
      }

      // Create database if it doesn't exist
      tempDb.query("CREATE DATABASE IF NOT EXISTS `ai-caller`", (err) => {
        if (err) {
          console.error("Failed to create database:", err);
          return;
        }

        // Create plans table if it doesn't exist
        const createTable = `
          USE \`ai-caller\`;
          CREATE TABLE IF NOT EXISTS plans (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            priceMonthly DECIMAL(10,2),
            priceAnnual DECIMAL(10,2),
            currency VARCHAR(10) NOT NULL,
            durationDays INT,
            totalCallsAllowedPerMonth VARCHAR(64),
            callDurationPerCallMaxMinutes INT,
            numberOfAgents INT,
            templatesAllowed INT,
            voicebotUsageCap VARCHAR(64),
            apiAccess BOOLEAN,
            customTemplates BOOLEAN,
            reportingAnalytics BOOLEAN,
            liveCallMonitor BOOLEAN,
            overagesAllowed BOOLEAN,
            overageChargesPer100Calls DECIMAL(10,2),
            trialEligible BOOLEAN,
            status ENUM('Active','Draft','Archived') NOT NULL
          );
        `;

        tempDb.query(createTable, (err) => {
          if (err) {
            console.error("Failed to create table:", err);
            return;
          }
          console.log("✅ Database and table created successfully");
          tempDb.end();
          
          // Reconnect to the main database
          db.connect(err => {
            if (err) {
              console.error("Still failed to connect to database:", err);
              return;
            }
            console.log("✅ Successfully connected to database");
          });
        });

        // After creating the plans table, add:
        const createClientsTable = `
          CREATE TABLE IF NOT EXISTS clients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            companyName VARCHAR(255) NOT NULL,
            companyEmail VARCHAR(255) NOT NULL,
            phoneNumber VARCHAR(32) NOT NULL,
            address TEXT,
            contactPersonName VARCHAR(255) NOT NULL,
            domainSubdomain VARCHAR(255),
            plan_id INT NOT NULL,
            apiAccess BOOLEAN NOT NULL DEFAULT FALSE,
            trialMode BOOLEAN NOT NULL DEFAULT FALSE,
            trialDuration INT,
            trialCallLimit INT,
            adminPassword VARCHAR(255) NOT NULL,
            autoSendLoginEmail BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (plan_id) REFERENCES plans(id)
          );
        `;

        tempDb.query(createClientsTable, (err) => {
          if (err) {
            console.error("Failed to create clients table:", err);
            return;
          }
          console.log("✅ Clients table created successfully");
        });
      });
    });
    return;
  }
  console.log("✅ MySQL Connected");
});

// Add error handler for lost connections
db.on('error', function(err) {
  console.error('Database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Attempting to reconnect to database...');
    db.connect(err => {
      if (err) {
        console.error("Failed to reconnect:", err);
        return;
      }
      console.log("✅ Reconnected to database");
    });
  } else {
    throw err;
  }
});

// Test API route
app.get("/", (req, res) => {
  res.send("🟢 Backend is running!");
});

// CRUD API for Plans

// Get all plans
app.get("/api/plans", (req, res) => {
  db.query("SELECT * FROM plans", (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch plans", error: err });
    }
    res.json({ success: true, data: results });
  });
});

// Get a single plan by id
app.get("/api/plans/:id", (req, res) => {
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
app.post("/api/plans", (req, res) => {
  const plan = req.body;
  // Remove id if present
  delete plan.id;
  db.query("INSERT INTO plans SET ?", plan, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to create plan", error: err });
    }
    // Fetch and return the created plan
    db.query("SELECT * FROM plans WHERE id = ?", [result.insertId], (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Plan created but failed to fetch", error: err });
      }
      res.status(201).json({ success: true, message: "Plan created", data: results[0] });
    });
  });
});

// Update a plan
// Update a plan by fetching current data and updating in the plans table
app.put("/api/plans/:id", (req, res) => {
  const planId = Number(req.params.id);
  const updatedPlan = req.body;

  // First, fetch the current plan data
  db.query("SELECT * FROM plans WHERE id = ?", [planId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch current plan data", error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    // Merge current data with updated fields
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
      templatesAllowed: updatedPlan.templatesAllowed !== undefined ? updatedPlan.templatesAllowed : currentPlan.templatesAllowed,
      voicebotUsageCap: updatedPlan.voicebotUsageCap !== undefined ? updatedPlan.voicebotUsageCap : currentPlan.voicebotUsageCap,
      apiAccess: updatedPlan.apiAccess !== undefined ? updatedPlan.apiAccess : currentPlan.apiAccess,
      customTemplates: updatedPlan.customTemplates !== undefined ? updatedPlan.customTemplates : currentPlan.customTemplates,
      reportingAnalytics: updatedPlan.reportingAnalytics !== undefined ? updatedPlan.reportingAnalytics : currentPlan.reportingAnalytics,
      liveCallMonitor: updatedPlan.liveCallMonitor !== undefined ? updatedPlan.liveCallMonitor : currentPlan.liveCallMonitor,
      overagesAllowed: updatedPlan.overagesAllowed !== undefined ? updatedPlan.overagesAllowed : currentPlan.overagesAllowed,
      overageChargesPer100Calls: updatedPlan.overageChargesPer100Calls !== undefined ? updatedPlan.overageChargesPer100Calls : currentPlan.overageChargesPer100Calls,
      trialEligible: updatedPlan.trialEligible !== undefined ? updatedPlan.trialEligible : currentPlan.trialEligible,
      status: updatedPlan.status !== undefined ? updatedPlan.status : currentPlan.status,
    };

    // Update the plan in the database
    db.query(
      "UPDATE plans SET ? WHERE id = ?",
      [updateFields, planId],
      (err, result) => {
        if (err) {
          console.error("Database error updating plan:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to update plan",
            error: err.message,
          });
        }
        if (result.affectedRows === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Plan not found" });
        }
        // Fetch and return the updated plan
        db.query(
          "SELECT * FROM plans WHERE id = ?",
          [planId],
          (err, results) => {
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
          }
        );
      }
    );
  });
});

// Delete a plan
app.delete("/api/plans/:id", (req, res) => {
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

// Get all clients (show latest assigned plan)
app.get("/api/clients", (req, res) => {
  // Join with assigned_plans to get the most recent plan assignment for each client
  const sql = `
    SELECT c.*, p.name AS planName
    FROM clients c
    LEFT JOIN (
      SELECT ap1.* FROM assigned_plans ap1
      INNER JOIN (
        SELECT client_id, MAX(start_date) AS max_start_date
        FROM assigned_plans
        GROUP BY client_id
      ) ap2 ON ap1.client_id = ap2.client_id AND ap1.start_date = ap2.max_start_date
    ) ap ON c.id = ap.client_id
    LEFT JOIN plans p ON ap.plan_id = p.id
  `;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch clients", error: err });
    }
    res.json({ success: true, data: results });
  });
});

// Get a single client by id
app.get("/api/clients/:id", (req, res) => {
  db.query(
    `SELECT clients.*, plans.name AS planName FROM clients LEFT JOIN plans ON clients.plan_id = plans.id WHERE clients.id = ?`,
    [req.params.id],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch client", error: err });
      }
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: "Client not found" });
      }
      res.json({ success: true, data: results[0] });
    }
  );
});

// Create a new client
app.post("/api/clients", (req, res) => {
  const client = req.body;
  delete client.id;
  delete client.confirmAdminPassword;
  // console.log("Creating client with data:", client);
  db.query("INSERT INTO clients SET ?", client, (err, result) => {
    if (err) {
      console.error("Failed to create client:", err);
      return res.status(500).json({ success: false, message: "Failed to create client", error: err });
    }
    db.query("SELECT * FROM clients WHERE id = ?", [result.insertId], (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Client created but failed to fetch", error: err });
      }
      res.status(201).json({ success: true, message: "Client created", data: results[0] });
    });
  });
});

// Update a client
app.put("/api/clients/:id", (req, res) => {
  const client = req.body;
  const clientId = Number(req.params.id);

  // Log the incoming request body for debugging
  console.log("[PUT /api/clients/:id] Incoming body:", client);

  // Remove undefined fields
  Object.keys(client).forEach((key) => {
    if (client[key] === undefined) {
      delete client[key];
    }
  });

  db.query(
    "UPDATE clients SET ? WHERE id = ?",
    [client, clientId],
    (err, result) => {
      if (err) {
        // Log the MySQL error for debugging
        console.error("[PUT /api/clients/:id] MySQL error:", err);
        return res.status(500).json({ success: false, message: "Failed to update client", error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Client not found" });
      }
      db.query("SELECT * FROM clients WHERE id = ?", [clientId], (err, results) => {
        if (err) {
          // Log the MySQL error for debugging
          console.error("[PUT /api/clients/:id] MySQL error (fetch after update):", err);
          return res.status(500).json({ success: false, message: "Client updated but failed to fetch", error: err });
        }
        res.json({ success: true, message: "Client updated successfully", data: results[0] });
      });
    }
  );
});

// Delete a client
app.delete("/api/clients/:id", (req, res) => {
  db.query("DELETE FROM clients WHERE id = ?", [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to delete client", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }
    res.json({ success: true, message: "Client deleted" });
  });
});

// User Roles API
// Get all user roles
app.get("/api/user-roles", (req, res) => {
  db.query("SELECT * FROM user_roles", (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch user roles", error: err });
    }
    res.json({ success: true, data: results });
  });
});

// Create a new user role
app.post("/api/user-roles", (req, res) => {
  const { role_name, description, permissions_summary, status } = req.body;
  if (!role_name || !description || !permissions_summary || !status) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }
  db.query(
    "INSERT INTO user_roles (role_name, description, permissions_summary, status) VALUES (?, ?, ?, ?)",
    [role_name, description, permissions_summary, status],
    (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Failed to create user role", error: err });
      }
      db.query("SELECT * FROM user_roles WHERE id = ?", [result.insertId], (err, results) => {
        if (err) {
          return res.status(500).json({ success: false, message: "User role created but failed to fetch", error: err });
        }
        res.status(201).json({ success: true, message: "User role created", data: results[0] });
      });
    }
  );
});

// Get a single user role by id
app.get("/api/user-roles/:id", (req, res) => {
  db.query("SELECT * FROM user_roles WHERE id = ?", [req.params.id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch user role", error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "User role not found" });
    }
    res.json({ success: true, data: results[0] });
  });
});

// Update a user role by id
app.put("/api/user-roles/:id", (req, res) => {
  const { role_name, description, permissions_summary, status } = req.body;
  db.query(
    "UPDATE user_roles SET role_name = ?, description = ?, permissions_summary = ?, status = ? WHERE id = ?",
    [role_name, description, permissions_summary, status, req.params.id],
    (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Failed to update user role", error: err });
      }
      db.query("SELECT * FROM user_roles WHERE id = ?", [req.params.id], (err, results) => {
        if (err) {
          return res.status(500).json({ success: false, message: "User role updated but failed to fetch", error: err });
        }
        res.json({ success: true, message: "User role updated", data: results[0] });
      });
    }
  );
});

// CRUD for client_users
// Get all client users with role name
app.get("/api/client-users", (req, res) => {
  db.query(
    `SELECT cu.*, ur.role_name 
     FROM client_users cu 
     LEFT JOIN user_roles ur ON cu.role_id = ur.id`,
    (err, results) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true, data: results });
    }
  );
});

// Get a single client user
app.get("/api/client-users/:id", (req, res) => {
  db.query(
    `SELECT cu.*, ur.role_name 
     FROM client_users cu 
     LEFT JOIN user_roles ur ON cu.role_id = ur.id
     WHERE cu.id = ?`,
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ success: false, error: err });
      if (results.length === 0) return res.status(404).json({ success: false, message: "User not found" });
      res.json({ success: true, data: results[0] });
    }
  );
});

// Create a new client user
app.post("/api/client-users", (req, res) => {
  const { full_name, email, phone, role_id, status, last_login, client_id } = req.body;
  const payload = { ...req.body, client_id: Number(client_id) };
  db.query(
    "INSERT INTO client_users (full_name, email, phone, role_id, status, last_login, client_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [full_name, email, phone, role_id, status, last_login, client_id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      db.query(
        `SELECT cu.*, ur.role_name 
         FROM client_users cu 
         LEFT JOIN user_roles ur ON cu.role_id = ur.id
         WHERE cu.id = ?`,
        [result.insertId],
        (err, results) => {
          if (err) return res.status(500).json({ success: false, error: err });
          res.status(201).json({ success: true, data: results[0] });
        }
      );
    }
  );
});

// Update a client user
app.put("/api/client-users/:id", (req, res) => {
  const { full_name, email, phone, role_id, status, last_login, client_id } = req.body;
  db.query(
    "UPDATE client_users SET full_name=?, email=?, phone=?, role_id=?, status=?, last_login=?, client_id=? WHERE id=?",
    [full_name, email, phone, role_id, status, last_login, client_id, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ success: false, error: err });
      db.query(
        `SELECT cu.*, ur.role_name 
         FROM client_users cu 
         LEFT JOIN user_roles ur ON cu.role_id = ur.id
         WHERE cu.id = ?`,
        [req.params.id],
        (err, results) => {
          if (err) return res.status(500).json({ success: false, error: err });
          res.json({ success: true, data: results[0] });
        }
      );
    }
  );
});

// Delete a client user
app.delete("/api/client-users/:id", (req, res) => {
  db.query("DELETE FROM client_users WHERE id = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User deleted" });
  });
});

// Reset a client user's password
app.post("/api/client-users/:id/reset-password", (req, res) => {
  const userId = req.params.id;
  const { oldPassword, password } = req.body;

  db.query('SELECT password FROM client_users WHERE id = ?', [userId], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const hashedPassword = results[0].password;
    const match = await bcrypt.compare(oldPassword, hashedPassword);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Old password is incorrect' });
    }
    const newHashedPassword = await bcrypt.hash(password, 10);
    db.query('UPDATE client_users SET password = ? WHERE id = ?', [newHashedPassword, userId], (err2) => {
      if (err2) {
        return res.status(500).json({ success: false, message: 'Failed to update password' });
      }
      res.json({ success: true, message: 'Password updated successfully' });
    });
  });
});

// Activate or deactivate a client user (only updates status)
app.put("/api/client-users/:id/status", (req, res) => {
  const { status } = req.body;
  if (!status || !["Active", "Suspended", "Pending"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid or missing status" });
  }
  db.query(
    "UPDATE client_users SET status = ? WHERE id = ?",
    [status, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "User not found" });
      res.json({ success: true, message: `User status updated to ${status}` });
    }
  );
});

// --- Admin Roles API ---
// GET all admin roles
app.get('/api/admin_roles', (req, res) => {
  db.query('SELECT * FROM admin_roles ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: results });
  });
});

// POST new admin role
app.post('/api/admin_roles', (req, res) => {
  const { name, description, permission_summary, status } = req.body;
  db.query(
    'INSERT INTO admin_roles (name, description, permission_summary, status) VALUES (?, ?, ?, ?)',
    [name, description, permission_summary, status],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      db.query('SELECT * FROM admin_roles WHERE id = ?', [result.insertId], (err2, rows) => {
        if (err2) return res.status(500).json({ success: false, message: err2.message });
        res.json({ success: true, data: rows[0] });
      });
    }
  );
});

// PUT update an admin role
app.put('/api/admin_roles/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, permission_summary, status } = req.body;
  db.query(
    'UPDATE admin_roles SET name = ?, description = ?, permission_summary = ?, status = ? WHERE id = ?',
    [name, description, permission_summary, status, id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      db.query('SELECT * FROM admin_roles WHERE id = ?', [id], (err2, rows) => {
        if (err2) return res.status(500).json({ success: false, message: err2.message });
        res.json({ success: true, data: rows[0] });
      });
    }
  );
});

// DELETE an admin role
app.delete('/api/admin_roles/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM admin_roles WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Role deleted successfully' });
  });
});

// GET a single admin role by id
app.get('/api/admin_roles/:id', (req, res) => {
  db.query('SELECT * FROM admin_roles WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (results.length === 0) return res.status(404).json({ success: false, message: "Role not found" });
    res.json({ success: true, data: results[0] });
  });
});

// Assign a plan to a client (insert into assigned_plans and update clients.plan_id)
app.post("/api/assigned-plans", (req, res) => {
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
    (client_id, plan_id, start_date, duration_override_days, is_trial, discount_type, discount_value, notes, auto_send_notifications)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      // Also update the client's plan_id
      db.query(
        "UPDATE clients SET plan_id = ? WHERE id = ?",
        [plan_id, client_id],
        (err2) => {
          if (err2) {
            console.error("Failed to update client's plan_id:", err2);
            return res.status(500).json({ success: false, message: "Plan assigned but failed to update client", error: err2 });
          }
          res.status(201).json({ success: true, message: "Plan assigned successfully" });
        }
      );
    }
  );
});

// --- Admin Users API ---
// Get all admin users
app.get('/api/admin_users', (req, res) => {
  db.query('SELECT id, name, email, roleName, lastLogin, status, createdOn FROM admin_users ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: results });
  });
});

// Get a single admin user by id
app.get('/api/admin_users/:id', (req, res) => {
  db.query('SELECT id, name, email, roleName, lastLogin, status, createdOn FROM admin_users WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (results.length === 0) return res.status(404).json({ success: false, message: 'Admin user not found' });
    res.json({ success: true, data: results[0] });
  });
});

// Create a new admin user
app.post('/api/admin_users', async (req, res) => {
  try {
    const { name, email, roleName, password, lastLogin, status } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
      'INSERT INTO admin_users (name, email, roleName, password, lastLogin, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, roleName, hashedPassword, lastLogin, status],
      (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        db.query('SELECT id, name, email, roleName, lastLogin, status, createdOn FROM admin_users WHERE id = ?', [result.insertId], (err2, rows) => {
          if (err2) return res.status(500).json({ success: false, message: err2.message });
          res.status(201).json({ success: true, data: rows[0] });
        });
      }
    );
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update an admin user
app.put('/api/admin_users/:id', async (req, res) => {
  try {
    const { name, email, roleName, password, lastLogin, status } = req.body;
    let updateFields = [name, email, roleName, lastLogin, status, req.params.id];
    let query = 'UPDATE admin_users SET name = ?, email = ?, roleName = ?, lastLogin = ?, status = ? WHERE id = ?';
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = 'UPDATE admin_users SET name = ?, email = ?, roleName = ?, password = ?, lastLogin = ?, status = ? WHERE id = ?';
      updateFields = [name, email, roleName, hashedPassword, lastLogin, status, req.params.id];
    }
    db.query(query, updateFields, (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      db.query('SELECT id, name, email, roleName, lastLogin, status, createdOn FROM admin_users WHERE id = ?', [req.params.id], (err2, rows) => {
        if (err2) return res.status(500).json({ success: false, message: err2.message });
        res.json({ success: true, data: rows[0] });
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete an admin user
app.delete('/api/admin_users/:id', (req, res) => {
  db.query('DELETE FROM admin_users WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Admin user not found' });
    res.json({ success: true, message: 'Admin user deleted successfully' });
  });
});

// Force logout an admin user
app.post('/api/admin_users/:id/force-logout', (req, res) => {
  // Implement session/token invalidation here if needed
  res.json({ success: true, message: 'User has been forced to log out.' });
});

// Reset an admin user's password
app.post('/api/admin_users/:id/reset-password', (req, res) => {
  const userId = req.params.id;
  const { oldPassword, password } = req.body;

  db.query('SELECT password FROM admin_users WHERE id = ?', [userId], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const hashedPassword = results[0].password;
    const match = await bcrypt.compare(oldPassword, hashedPassword);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Old password is incorrect' });
    }
    const newHashedPassword = await bcrypt.hash(password, 10);
    db.query('UPDATE admin_users SET password = ? WHERE id = ?', [newHashedPassword, userId], (err2) => {
      if (err2) {
        return res.status(500).json({ success: false, message: 'Failed to update password' });
      }
      res.json({ success: true, message: 'Password updated successfully' });
    });
  });
});

// Get current admin user's profile
app.get('/api/admin_users/me', (req, res) => {
  const userId = req.header('x-user-id');
  if (!userId) return res.status(401).json({ success: false, message: 'Missing user ID' });
  db.query('SELECT id, name, email, bio, profile_picture FROM admin_users WHERE id = ?', [userId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (results.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: results[0] });
  });
});

// Update current admin user's profile
app.patch('/api/admin_users/me', (req, res) => {
  const userId = req.header('x-user-id');
  if (!userId) return res.status(401).json({ success: false, message: 'Missing user ID' });
  const { name, bio, profile_picture } = req.body;
  db.query('UPDATE admin_users SET name = ?, bio = ?, profile_picture = ? WHERE id = ?', [name, bio, profile_picture, userId], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    db.query('SELECT id, name, email, bio, profile_picture FROM admin_users WHERE id = ?', [userId], (err2, results) => {
      if (err2) return res.status(500).json({ success: false, message: err2.message });
      res.json({ success: true, data: results[0] });
    });
  });
});

// Upload profile picture
app.post('/api/admin_users/me/profile-picture', upload.single('profile_picture'), (req, res) => {
  const userId = req.header('x-user-id');
  if (!userId) return res.status(401).json({ success: false, message: 'Missing user ID' });
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const filePath = `/uploads/${req.file.filename}`;
  db.query('UPDATE admin_users SET profile_picture = ? WHERE id = ?', [filePath, userId], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, profile_picture: filePath });
  });
});

// Delete profile picture
app.delete('/api/admin_users/me/profile-picture', (req, res) => {
  const userId = req.header('x-user-id');
  if (!userId) return res.status(401).json({ success: false, message: 'Missing user ID' });
  db.query('UPDATE admin_users SET profile_picture = NULL WHERE id = ?', [userId], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true });
  });
});

// Start server
app.listen(5000, () => {
  console.log("🚀 Server running at http://localhost:5000");
});
