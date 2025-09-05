// backend/config/database.js
const mysql = require("mysql2");

// DB config
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ai-caller",
  multipleStatements: true
});

// Connect to DB
db.connect(err => {
  if (err) {
    console.error("❌ Database connection failed:", err.stack);
    // Try to create database and table if they don't exist
    const tempDb = mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || ""
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
            agentsAllowed INT,
            voicebotUsageCap VARCHAR(64),
            apiAccess BOOLEAN,
            customAgents BOOLEAN,
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
            initializeTables();
          });
        });
      });
    });
    return;
  }
  console.log("✅ MySQL Connected");
  initializeTables();
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

function initializeTables() {
  // Create clients table
  const createClientsTable = `
    CREATE TABLE IF NOT EXISTS clients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      companyName VARCHAR(255) NOT NULL,
      companyEmail VARCHAR(255) NOT NULL,
      phoneNumber VARCHAR(32) NOT NULL,
      address TEXT,
      contactPersonName VARCHAR(255) NOT NULL,
      domainSubdomain VARCHAR(255),
      referralCode VARCHAR(64) NULL,
      plan_id INT NOT NULL,
      apiAccess BOOLEAN NOT NULL DEFAULT FALSE,
      trialMode BOOLEAN NOT NULL DEFAULT FALSE,
      trialDuration INT,
      trialCallLimit INT,
      trialEndsAt DATETIME NULL,
      totalCallsMade INT NOT NULL DEFAULT 0,
      monthlyCallsMade INT NOT NULL DEFAULT 0,
      monthlyCallLimit INT,
      lastMonthlyReset DATE DEFAULT (CURDATE()),
      adminPassword VARCHAR(255) NOT NULL,
      autoSendLoginEmail BOOLEAN NOT NULL DEFAULT TRUE,
      avatar_url VARCHAR(255) NULL,
      bio TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  db.query(createClientsTable, (err) => {
    if (err) {
      console.error("Failed to create clients table:", err);
      return;
    }
    console.log("✅ Clients table created successfully");
  });

  // Ensure clients table has all required columns
  const ensureClientsColumns = `
    ALTER TABLE clients 
    ADD COLUMN IF NOT EXISTS totalCallsMade INT NOT NULL DEFAULT 0 AFTER trialEndsAt,
    ADD COLUMN IF NOT EXISTS monthlyCallsMade INT NOT NULL DEFAULT 0 AFTER totalCallsMade,
    ADD COLUMN IF NOT EXISTS monthlyCallLimit INT AFTER monthlyCallsMade,
    ADD COLUMN IF NOT EXISTS lastMonthlyReset DATE DEFAULT (CURDATE()) AFTER monthlyCallLimit;
  `;

  db.query(ensureClientsColumns, (err) => {
    if (err) {
      console.error("Failed to ensure clients table columns:", err);
    } else {
      console.log("✅ Clients table columns ensured");
    }
  });

  // ... existing code ...

  // Create admin_users table
  const createAdminUsersTable = `
    CREATE TABLE IF NOT EXISTS admin_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      roleName VARCHAR(100) NOT NULL,
      lastLogin DATETIME,
      status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
      avatar_url VARCHAR(255) NULL,
      bio TEXT NULL,
      phone VARCHAR(32) NULL,
      createdOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.query(createAdminUsersTable, (err) => {
    if (err) {
      console.error("Failed to create admin_users table:", err);
    } else {
      console.log("✅ Admin users table ready");
    }
  });

  // Create assigned_plans table
  const createAssignedPlansTable = `
    CREATE TABLE IF NOT EXISTS assigned_plans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_id INT NOT NULL,
      plan_id INT NOT NULL,
      start_date DATE,
      duration_override_days INT,
      is_trial BOOLEAN DEFAULT FALSE,
      discount_type VARCHAR(50),
      discount_value DECIMAL(10,2),
      notes TEXT,
      auto_send_notifications BOOLEAN DEFAULT FALSE,
      is_enabled TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.query(createAssignedPlansTable, (err) => {
    if (err) {
      console.error("Failed to create assigned_plans table:", err);
    } else {
      console.log("✅ Assigned plans table ready");
    }
  });

  // Create agents table
  const createAgentsTable = `
    CREATE TABLE IF NOT EXISTS agents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      agent_id VARCHAR(255) NOT NULL UNIQUE,
      client_id INT,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      first_message TEXT,
      system_prompt TEXT,
      language_id INT,
      voice_id VARCHAR(255),
      model VARCHAR(255),
      tags JSON,
      platform_settings JSON,
      language_code VARCHAR(20),
      additional_languages TEXT,
      custom_llm_url TEXT,
      custom_llm_model_id VARCHAR(255),
      custom_llm_api_key TEXT,
      custom_llm_headers JSON,
      llm VARCHAR(255),
      temperature FLOAT,
      mcp_server_ids JSON,
      created_by INT,
      created_by_name VARCHAR(255),
      created_by_type VARCHAR(20),
      status VARCHAR(20) DEFAULT 'Published',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  db.query(createAgentsTable, (err) => {
    if (err) {
      console.error("Failed to create agents table:", err);
    } else {
      console.log("✅ Agents table ready");
    }
  });

  // Create languages table
  const createLanguagesTable = `
    CREATE TABLE IF NOT EXISTS languages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(20) NOT NULL,
      country_code VARCHAR(5) NOT NULL,
      calling_code VARCHAR(10) NOT NULL,
      enabled BOOLEAN DEFAULT TRUE
    );
  `;

  db.query(createLanguagesTable, (err) => {
    if (err) {
      console.error("Failed to create languages table:", err);
    } else {
      console.log("✅ Languages table ready");
    }
  });

  // Create knowledge_base table
  const createKnowledgeBaseTable = `
    CREATE TABLE IF NOT EXISTS knowledge_base (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_id INT,
      type VARCHAR(32) NOT NULL,
      name VARCHAR(255) NOT NULL,
      url TEXT,
      file_path VARCHAR(255),
      text_content TEXT,
      size VARCHAR(32),
      created_by VARCHAR(255),
      created_at DATETIME,
      updated_at DATETIME
    );
  `;

  db.query(createKnowledgeBaseTable, (err) => {
    if (err) {
      console.error("Failed to create knowledge base table:", err);
    } else {
      console.log("✅ Knowledge base table ready");
    }
  });

  // Create agent_knowledge_base table
  const createAgentKnowledgeBaseTable = `
    CREATE TABLE IF NOT EXISTS agent_knowledge_base (
      id INT AUTO_INCREMENT PRIMARY KEY,
      agent_id VARCHAR(255) NOT NULL UNIQUE,
      knowledge_base_items JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_agent_id (agent_id)
    ) ENGINE=InnoDB;
  `;

  db.query(createAgentKnowledgeBaseTable, (err) => {
    if (err) {
      console.error("Failed to create agent knowledge base table:", err);
    } else {
      console.log("✅ Agent knowledge base table ready");
    }
  });

  // Create sales_admin_referral_codes table
  const createSalesAdminReferralCodes = `
    CREATE TABLE IF NOT EXISTS sales_admin_referral_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_user_id INT NOT NULL,
      referral_code VARCHAR(64) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_admin_user (admin_user_id)
    );
  `;

  db.query(createSalesAdminReferralCodes, (err) => {
    if (err) {
      console.error("Failed to create sales_admin_referral_codes table:", err);
    } else {
      console.log("✅ Sales admin referral codes table ready");
    }
  });

  // Create referrals table
  const createReferralsTable = `
    CREATE TABLE IF NOT EXISTS referrals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_user_id INT NOT NULL,
      client_id INT NOT NULL,
      referral_code VARCHAR(64) NOT NULL,
      referred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status ENUM('pending', 'converted', 'expired') DEFAULT 'pending',
      plan_subscribed VARCHAR(64) NULL,
      is_trial TINYINT(1) NOT NULL DEFAULT 1,
      conversion_date DATETIME NULL,
      revenue_generated DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      commission_amount DECIMAL(12,2) NULL,
      commission_status ENUM('pending','approved','paid') NOT NULL DEFAULT 'pending'
    );
  `;

  db.query(createReferralsTable, (err) => {
    if (err) {
      console.error("Failed to create referrals table:", err);
    } else {
      console.log("✅ Referrals table ready");
    }
  });

  // Create user_roles table
  const createUserRolesTable = `
    CREATE TABLE IF NOT EXISTS user_roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      role_name VARCHAR(100) NOT NULL,
      description TEXT,
      permissions_summary TEXT,
      status ENUM('Active', 'Inactive') DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.query(createUserRolesTable, (err) => {
    if (err) {
      console.error("Failed to create user_roles table:", err);
    } else {
      console.log("✅ User roles table ready");
    }
  });

  // Create client_users table
  const createClientUsersTable = `
    CREATE TABLE IF NOT EXISTS client_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(32),
      role_id INT,
      status ENUM('Active', 'Suspended', 'Pending') DEFAULT 'Active',
      last_login DATETIME,
      client_id INT NOT NULL,
      password VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.query(createClientUsersTable, (err) => {
    if (err) {
      console.error("Failed to create client_users table:", err);
    } else {
      console.log("✅ Client users table ready");
    }
  });

  // Create admin_roles table
  const createAdminRolesTable = `
    CREATE TABLE IF NOT EXISTS admin_roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      permission_summary TEXT,
      status ENUM('Active', 'Inactive') DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.query(createAdminRolesTable, (err) => {
    if (err) {
      console.error("Failed to create admin_roles table:", err);
    } else {
      console.log("✅ Admin roles table ready");
    }
  });

  // Create workspace_secrets table
  const createWorkspaceSecretsTable = `
    CREATE TABLE IF NOT EXISTS workspace_secrets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      secret_id VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'new',
      used_by JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_secret_id (secret_id),
      INDEX idx_name (name)
    );
  `;

  db.query(createWorkspaceSecretsTable, (err) => {
    if (err) {
      console.error("Failed to create workspace secrets table:", err);
    } else {
      console.log("✅ Workspace secrets table ready");
    }
  });

  // Create mcp_servers table
  const createMcpServersTable = `
    CREATE TABLE IF NOT EXISTS mcp_servers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      mcp_server_id VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      description TEXT NULL,
      server_type VARCHAR(32) NULL,
      url TEXT,
      secret_id VARCHAR(255) NULL,
      headers JSON NULL,
      approval_mode VARCHAR(32) DEFAULT 'always',
      trusted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  db.query(createMcpServersTable, (err) => {
    if (err) {
      console.error('Failed to create mcp_servers table:', err);
    } else {
      console.log('✅ MCP servers table ready');
    }
  });

  // Create agent_analysis_criteria table
  const createCriteriaTable = `
    CREATE TABLE IF NOT EXISTS agent_analysis_criteria (
      id INT AUTO_INCREMENT PRIMARY KEY,
      agent_id VARCHAR(64) NOT NULL,
      name VARCHAR(255) NOT NULL,
      prompt TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.query(createCriteriaTable, (err) => {
    if (err) {
      console.error("Failed to create agent_analysis_criteria table:", err);
    } else {
      console.log("✅ Agent analysis criteria table ready");
    }
  });

  // Create agent_analysis_data_collection table
  const createDataCollectionTable = `
    CREATE TABLE IF NOT EXISTS agent_analysis_data_collection (
      id INT AUTO_INCREMENT PRIMARY KEY,
      agent_id VARCHAR(64) NOT NULL,
      data_type VARCHAR(32) NOT NULL,
      identifier VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.query(createDataCollectionTable, (err) => {
    if (err) {
      console.error("Failed to create agent_analysis_data_collection table:", err);
    } else {
      console.log("✅ Agent analysis data collection table ready");
    }
  });

  // Create agent_widget_settings table
  const createWidgetSettingsTable = `
    CREATE TABLE IF NOT EXISTS agent_widget_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      agent_id VARCHAR(64) NOT NULL UNIQUE,
      feedback_mode ENUM('none', 'during', 'end') DEFAULT 'during',
      embed_code TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_agent_id (agent_id)
    );
  `;

  db.query(createWidgetSettingsTable, (err) => {
    if (err) {
      console.error('Failed to create widget settings table:', err);
    } else {
      console.log('✅ Widget settings table ready');
    }
  });

  // Create agent_advanced_settings table
  const createAgentAdvancedSettingsTable = `
    CREATE TABLE IF NOT EXISTS agent_advanced_settings (
      agent_id VARCHAR(64) PRIMARY KEY,
      turn_timeout INT,
      silence_end_call_timeout INT,
      max_conversation_duration INT,
      keywords TEXT,
      text_only BOOLEAN,
      user_input_audio_format VARCHAR(64),
      client_events TEXT,
      privacy_settings JSON,
      conversations_retention_period INT,
      delete_transcript_and_derived_fields BOOLEAN,
      delete_audio BOOLEAN,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  db.query(createAgentAdvancedSettingsTable, (err) => {
    if (err) {
      console.error("Failed to create agent_advanced_settings table:", err);
    } else {
      console.log("✅ Agent advanced settings table ready");
    }
  });

  // Create campaigns table (batch calling mirror)
  const createCampaignsTable = `
    CREATE TABLE IF NOT EXISTS campaigns (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      external_id VARCHAR(255) NULL,
      name VARCHAR(255) NOT NULL,
      clientName VARCHAR(255) NOT NULL,
      agentName VARCHAR(255) NULL,
      type VARCHAR(100) NOT NULL,
      callsAttempted INT NOT NULL DEFAULT 0,
      callsTargeted INT NOT NULL DEFAULT 0,
      startDate DATETIME NULL,
      endDate DATETIME NULL,
      status ENUM('Active','Paused','Completed') NOT NULL DEFAULT 'Active',
      successRate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_external (external_id),
      INDEX idx_status (status),
      INDEX idx_dates (startDate, endDate)
    );
  `;

  db.query(createCampaignsTable, (err) => {
    if (err) {
      console.error('Failed to create campaigns table:', err);
    } else {
      console.log('✅ Campaigns table ready');
      
      // Add external_id column if it doesn't exist (migration)
      db.query(`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS external_id VARCHAR(255) NULL`, (alterErr) => {
        if (alterErr && !alterErr.message.includes('Duplicate column name')) {
          console.error('Failed to add external_id column:', alterErr);
        } else {
          console.log('✅ Campaigns table external_id column ensured');
        }
      });
      
      // Add agentName column if it doesn't exist (migration)
      db.query(`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS agentName VARCHAR(255) NULL`, (alterErr2) => {
        if (alterErr2 && !alterErr2.message.includes('Duplicate column name')) {
          console.error('Failed to add agentName column:', alterErr2);
        } else {
          console.log('✅ Campaigns table agentName column ensured');
        }
      });
    }
  });

  // Create calls table
  const createCallsTable = `
    CREATE TABLE IF NOT EXISTS calls (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      campaignId INT NOT NULL,
      callerId VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL,
      duration INT NULL,
      agent VARCHAR(255) NULL,
      transcriptionSnippet TEXT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_calls_campaign FOREIGN KEY (campaignId) REFERENCES campaigns(id) ON DELETE CASCADE,
      INDEX idx_campaign_status (campaignId, status),
      INDEX idx_timestamp (timestamp)
    );
  `;

  db.query(createCallsTable, (err) => {
    if (err) {
      console.error('Failed to create calls table:', err);
    } else {
      console.log('✅ Calls table ready');
    }
  });

  // Indices for performance on campaigns
  db.query(`CREATE INDEX IF NOT EXISTS idx_campaigns_updatedAt ON campaigns(updatedAt)`, () => {});

  // Create agents_calls table (live agents status for monitoring)
  const createAgentsCallsTable = `
    CREATE TABLE IF NOT EXISTS agents_calls (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      status ENUM('Available','Busy','Offline') NOT NULL DEFAULT 'Available',
      activeCalls INT NOT NULL DEFAULT 0,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_agent_status (status)
    );
  `;

  db.query(createAgentsCallsTable, (err) => {
    if (err) {
      console.error('Failed to create agents_calls table:', err);
    } else {
      console.log('✅ Agents_calls table ready');
    }
  });
}

module.exports = db;
