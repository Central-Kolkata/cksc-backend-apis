# AWS Elastic Beanstalk Deployment Guide (For Future Use)

This document is a complete, step-by-step guide to deploy your Node.js backend (previously on Railway) to AWS Elastic Beanstalk with CI/CD, HTTPS, and MongoDB Atlas connectivity. You can follow this again in 6 months without remembering anything.

---

## **1. Prerequisites**

Before starting:

* You have an AWS Account.
* You have a GitHub repository.
* Your project runs with: `npm start` or `node server.js`.
* You know your MongoDB Atlas connection string.
* You have your environment variables ready.

---

# **2. Create IAM User for Deployment**

This user will be used only for GitHub CI/CD.

### **Steps:**

1. Go to **AWS Console → IAM → Users → Create User**
2. Username: `eb-deploy-user`
3. Access Type: **Programmatic Access only**
4. Attach policy:

   * `AdministratorAccess-AWSElasticBeanstalk`
5. Create user → Copy:

   * **Access key ID**
   * **Secret access key**

### **What this does:**

Allows GitHub Actions to deploy to AWS automatically.

---

# **3. Install EB CLI on Your Computer**

```
pip install awsebcli
```

Verify:

```
eb --version
```

---

# **4. Initialize Elastic Beanstalk in Your Project**

Go to your backend project folder:

```
eb init
```

Choose:

* Region: **ap-south-1 (Mumbai)**
* Platform: **Node.js 20 or 24**
* Skip CodeCommit: **n**
* SSH: optional

### This creates:

```
.elasticbeanstalk/config.yml
.elasticbeanstalk/global.yml
```

Commit these two files.

---

# **5. Create EB Environment**

Run:

```
eb create my-env-name
```

Choose:

* Environment type: **Single instance or Load Balanced**
* Instance type: **t3.micro (free tier eligible)**

After a few minutes, your environment will be live.

Check status:

```
eb status
```

Should show: **Health: Green**

---

# **6. Add Environment Variables in EB Console**

Go to:

```
AWS Console → Elastic Beanstalk → Environments → Configuration
```

Scroll to **Platform software → Environment properties**.

Click **Add environment property** for each key-value pair.

### Minimum required vars:

* NODE_ENV = production
* PORT = 5001
* MONGO_URI = <mongo connection>
* JWT_SECRET = <your secret>
* CLOUDINARY vars (if used)
* EMAIL vars (if used)
* BACKEND_BASE_URL (your EB URL)
* FRONTEND_BASE_URL

Save → EB restarts automatically.

---

# **7. Whitelist AWS Instance in MongoDB Atlas**

Go to **Atlas → Network Access**.

Add the EC2 instance public IP.

(For quick testing, you may allow `0.0.0.0/0`, but restrict later.)

---

# **8. Configure `.gitignore` Properly**

Add this inside `.gitignore`:

```
# Elastic Beanstalk Files
.elasticbeanstalk/*
!.elasticbeanstalk/*.cfg.yml
!.elasticbeanstalk/*.global.yml
```

This keeps only config files, ignoring the rest.

Commit the changes.

---

# **9. Add GitHub Secrets for CI/CD**

Go to:

```
GitHub → Repo → Settings → Secrets → Actions
```

Add these secrets:

* AWS_ACCESS_KEY_ID
* AWS_SECRET_ACCESS_KEY
* AWS_REGION (ap-south-1)
* EB_APPLICATION_NAME (from eb status)
* EB_ENVIRONMENT_NAME (from eb status)

---

# **10. Add GitHub Actions Workflow**

Create file:

```
.github/workflows/deploy.yml
```

Paste:

```
name: Deploy to Elastic Beanstalk

on:
  push:
    branches:
      - master

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Install AWS EB CLI
        run: |
          pip install awsebcli --break-system-packages || pip install awsebcli

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Deploy to Elastic Beanstalk
        run: eb deploy ${{ secrets.EB_ENVIRONMENT_NAME }}
```

Push to GitHub → Actions tab → Deployment begins.

---

# **11. Test Deployment**

Check your app URL:

```
https://<your-env>.elasticbeanstalk.com/health
```

Ensure FE uses the same URL.

---

# **12. Enable HTTPS (if needed)**

AWS EB default domain already supports HTTPS.

If using a custom domain:

1. Request certificate in **AWS Certificate Manager**
2. Validate via DNS
3. Update EB Load Balancer → add HTTPS listener
4. Update DNS to point to EB CNAME

---

# **13. Updating the App Later**

To deploy new updates:

* Make changes locally
* Commit
* Push to `master`

GitHub Actions will handle:

* Build
* Deployment
* Updating EB

No need to log into AWS.

---

# **14. Cleaning Up / Troubleshooting**

### Useful commands:

```
eb status
```

```
eb logs
```

```
eb deploy
```

```
eb restart
```

### Common issues:

* Health Red → Missing env vars or Mongo blocked
* EB deploy fails → `.elasticbeanstalk` missing
* GitHub deploy fails → wrong secrets or wrong branch

---

# **15. Cost Control / Free Tier Tips**

* Use **t3.micro** or **t2.micro** instance
* Keep **Min = 1**, **Max = 1** in scaling
* Disable load balancer if possible (Single instance environment)
* Set CloudWatch logs to low retention
* Monitor monthly bill

---

# **16. When Rebuilding After 6 Months**

You only need to do:

1. Reinstall EB CLI if needed
2. Run `eb init` again (only once)
3. Recreate IAM deploy user (if keys expired)
4. Reconnect GitHub secrets
5. Create a new EB app/env (or reuse existing)
6. Add environment variables
7. Whitelist new EC2 IP in MongoDB Atlas
8. Push code → GitHub Actions deploys automatically

Everything else remains the same.

---

# **Done**

This document contains everything required to:

* Rebuild
* Re-deploy
* Recover
* Migrate
* Maintain

a Node.js app on AWS Elastic Beanstalk in the future.
