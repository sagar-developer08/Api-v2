# Postman Collection – School SaaS API

## Import

1. Open Postman → **Import** → drag or select:
   - `School_SaaS_API.postman_collection.json`
   - `School_SaaS_Local.postman_environment.json` (optional)
2. Select the **School SaaS – Local** environment if you imported it.

## Collection variables

| Variable        | Set by                         | Use                          |
|----------------|---------------------------------|------------------------------|
| `baseUrl`      | Default `http://localhost:8080` | All requests                 |
| `adminToken`   | Verify OTP / Login              | Setup Wizard, Profile        |
| `superAdminToken` | Super Admin Login            | Super Admin endpoints        |
| `schoolId`     | Verify OTP                      | Setup Wizard, Super Admin    |
| `schoolCode`   | Verify OTP                      | Login                        |

**Verify OTP** and **Login** requests run scripts that save `token`, `schoolId`, and `schoolCode` into collection variables. Run them in order so later requests use the right auth and IDs.

## Suggested flow

1. **Health** → Health Check  
2. **Auth** → Register (send OTP) → check email for OTP  
3. **Auth** → Verify OTP (use OTP from email; scripts set `adminToken`, `schoolId`, `schoolCode`)  
4. **Setup Wizard** → Step 1 → Step 2 → Step 3 → Finish  
5. **Super Admin** → Super Admin Login (scripts set `superAdminToken`)  
6. **Super Admin** → List Schools → Get School Details → Approve School  
7. **Auth** → Login (School Admin) — now works because school is Approved  
8. **Auth** → Get Profile  

Change `baseUrl` in the collection or environment if your API runs on another host/port.
