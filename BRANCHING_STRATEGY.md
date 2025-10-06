# Git Branching Strategy

## 🌳 Branch Structure

We use a **two-branch strategy** for clean separation between development and production:

```
master (production)     dev (development/staging)     feature branches
      │                        │                              │
      │                        │                              │
      │◄───────────────────────┤◄─────────────────────────────┤
      │    Merge after testing │      Merge features here     │
      │                        │                              │
    LIVE                   STAGING                     DEVELOPMENT
```

---

## 📋 Branch Descriptions

### **`master`** - Production Branch

- **Purpose:** Production-ready code only
- **Deployed to:** Production server (Railway/Render/DigitalOcean)
- **URL:** `https://api.ieracademy.com`
- **Environment:** Production env vars (live Stripe, production database)
- **Protected:** Requires pull request review
- **Deploy trigger:** Automatic on push

**Rules:**
- ❌ Never commit directly to master
- ✅ Only merge from `dev` branch
- ✅ All code must be tested in dev first
- ✅ Use for hotfixes only (in emergency)

---

### **`dev`** - Development/Staging Branch

- **Purpose:** Development and testing
- **Deployed to:** Staging server
- **URL:** `https://staging-api.ieracademy.com`
- **Environment:** Staging env vars (test Stripe, staging database)
- **Protected:** Optional
- **Deploy trigger:** Automatic on push

**Rules:**
- ✅ Merge feature branches here first
- ✅ Test thoroughly before promoting to master
- ✅ Can commit directly for small changes
- ✅ Keep in sync with master

---

### **`feature/*`** - Feature Branches

- **Purpose:** Individual features or bug fixes
- **Deployed to:** Local development
- **Lifetime:** Temporary (delete after merge)

**Naming convention:**
```
feature/add-payment-logging
feature/improve-email-templates
bugfix/enrollment-validation
hotfix/stripe-webhook-error
```

---

## 🔄 Complete Workflow

### 1. **Create Feature Branch**

```bash
# Start from dev branch
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/my-new-feature
```

### 2. **Develop & Commit**

```bash
# Make changes
# ... code code code ...

# Commit changes
git add .
git commit -m "feat: add new feature description"

# Push to remote
git push -u origin feature/my-new-feature
```

### 3. **Test Locally**

```bash
# Run backend
npm run dev

# Test endpoints
curl http://localhost:3001/api/health

# Check database
npx prisma studio
```

### 4. **Merge to Dev (Staging)**

```bash
# Create pull request on GitHub:
# feature/my-new-feature → dev

# After review and approval:
git checkout dev
git pull origin dev
git merge feature/my-new-feature
git push origin dev

# Delete feature branch
git branch -d feature/my-new-feature
git push origin --delete feature/my-new-feature
```

**Backend automatically:**
- Deploys to staging server
- Connects to staging database
- Uses test Stripe keys

### 5. **Test in Dev Environment**

- Full API testing
- Payment flow verification
- Email delivery check
- Database integrity
- Performance testing

### 6. **Promote to Production**

```bash
# Create pull request on GitHub:
# dev → master

# After final approval:
git checkout master
git pull origin master
git merge dev
git push origin master
```

**Backend automatically:**
- Deploys to production
- Connects to production database
- Uses live Stripe keys
- Students affected immediately

---

## 🚨 Hotfix Workflow (Emergency)

For critical bugs in production that can't wait:

```bash
# Create hotfix from master
git checkout master
git pull origin master
git checkout -b hotfix/critical-bug-fix

# Fix the bug
# ... code ...

# Commit and push
git commit -am "hotfix: fix critical bug description"
git push -u origin hotfix/critical-bug-fix

# Merge to master immediately
git checkout master
git merge hotfix/critical-bug-fix
git push origin master

# Also merge back to dev
git checkout dev
git merge hotfix/critical-bug-fix
git push origin dev

# Delete hotfix branch
git branch -d hotfix/critical-bug-fix
git push origin --delete hotfix/critical-bug-fix
```

---

## 📊 Environment Mapping

| Branch         | Environment | Domain                       | Database  | Stripe Keys |
| -------------- | ----------- | ---------------------------- | --------- | ----------- |
| `master`       | Production  | `api.ieracademy.com`         | Live DB   | Live        |
| `dev`          | Staging     | `staging-api.ieracademy.com` | Stage DB  | Test        |
| `feature/*`    | Local       | `localhost:3001`             | Local DB  | Test        |

---

## ✅ Best Practices

### Do's ✅

- ✅ Always create feature branches from `dev`
- ✅ Keep commits small and focused
- ✅ Write descriptive commit messages
- ✅ Test locally before pushing
- ✅ Delete branches after merging
- ✅ Keep dev and master in sync
- ✅ Pull before starting new work
- ✅ Use pull requests for code review

### Don'ts ❌

- ❌ Never commit directly to `master`
- ❌ Don't merge untested code to `dev`
- ❌ Don't push broken code
- ❌ Don't commit sensitive data (`.env`)
- ❌ Don't skip testing
- ❌ Don't keep old feature branches
- ❌ Don't force push to shared branches

---

## 📝 Commit Message Convention

Use clear, descriptive commit messages:

```bash
# Features
git commit -m "feat: add enrollment email notification"
git commit -m "feat: implement stripe webhook handler"

# Bug fixes
git commit -m "fix: resolve payment validation error"
git commit -m "fix: correct database connection timeout"

# Documentation
git commit -m "docs: update API documentation"
git commit -m "docs: add deployment guide"

# Refactoring
git commit -m "refactor: simplify payment logic"
git commit -m "refactor: extract email service"

# Database
git commit -m "db: add payment status field"
git commit -m "db: create enrollment index"

# Chores
git commit -m "chore: update dependencies"
git commit -m "chore: clean up unused imports"
```

---

## 🎯 Quick Reference

### Common Commands

```bash
# Switch to dev
git checkout dev

# Create new feature
git checkout -b feature/my-feature

# Update current branch with latest dev
git checkout dev
git pull origin dev
git checkout feature/my-feature
git merge dev

# Push feature branch
git push -u origin feature/my-feature

# Merge dev to master (deploy to production)
git checkout master
git pull origin master
git merge dev
git push origin master

# View all branches
git branch -a

# Delete local branch
git branch -d feature/my-feature

# Delete remote branch
git push origin --delete feature/my-feature
```

---

## 🚀 Deployment Checklist

### Before Merging to Dev

- [ ] Code runs without errors
- [ ] All tests pass
- [ ] API endpoints tested
- [ ] Database migrations work
- [ ] No sensitive data committed
- [ ] Environment variables documented
- [ ] Logs reviewed

### Before Merging to Master

- [ ] Dev environment fully tested
- [ ] Payment flow verified
- [ ] Email delivery working
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Database migrations tested
- [ ] Frontend compatible
- [ ] Monitoring configured

---

## 🔄 Keeping Branches in Sync

### Sync dev with master (after hotfix)

```bash
git checkout dev
git pull origin dev
git merge master
git push origin dev
```

### Sync feature branch with dev

```bash
git checkout feature/my-feature
git merge dev
# Resolve conflicts if any
git push origin feature/my-feature
```

---

## 📞 Need Help?

### Common Issues

**Issue:** Merge conflicts

```bash
# Solution
git status  # See conflicting files
# Edit files to resolve conflicts
git add .
git commit -m "resolve: merge conflicts"
```

**Issue:** Accidentally committed to master

```bash
# Solution (if not pushed yet)
git reset --soft HEAD~1  # Undo last commit
git stash  # Save changes
git checkout dev  # Switch to dev
git stash pop  # Apply changes
```

**Issue:** Need to undo last push

```bash
# Contact team first! Then:
git revert HEAD
git push origin branch-name
```

---

## 🎓 Summary

**Simple Workflow:**

1. **Feature development** → `feature/*` branch
2. **Testing & staging** → `dev` branch
3. **Production** → `master` branch

**Remember:**
- `master` = LIVE API (careful!)
- `dev` = Testing environment (safe to experiment)
- `feature/*` = Your workspace (do whatever)

**Golden Rules:**
1. Never push directly to master
2. Always test in dev first
3. Keep branches up to date
4. Delete branches after merging

---

## 🎉 You're Ready!

Follow this strategy and you'll have:
- ✅ Safe production deployments
- ✅ Proper testing workflow
- ✅ Clean git history
- ✅ Easy rollbacks
- ✅ Team collaboration

**Happy coding!** 🚀

