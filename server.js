//server.js
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

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

// Get all clients
app.get("/api/clients", (req, res) => {
  db.query(
    `SELECT clients.*, plans.name AS planName FROM clients LEFT JOIN plans ON clients.plan_id = plans.id`,
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch clients", error: err });
      }
      res.json({ success: true, data: results });
    }
  );
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
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: "Password is required" });
  }
  db.query(
    "UPDATE client_users SET password = ? WHERE id = ?",
    [password, userId],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Failed to reset password", error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "User not found" });
      res.json({ success: true, message: "Password reset successfully" });
    }
  );
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

// Start server
app.listen(5000, () => {
  console.log("🚀 Server running at http://localhost:5000");
});
