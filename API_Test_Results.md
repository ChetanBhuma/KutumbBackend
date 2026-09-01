# API Test Report

**Date:** 12/2/2026, 10:12:13 am
**Base URL:** http://localhost:5000/api/v1

| Endpoint | Method | Status | Code | Duration | Error |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Get Current User | GET | ✅ PASS | 200 | 1099ms | - |
| List Citizens | GET | ✅ PASS | 200 | 1942ms | - |
| List Officers | GET | ✅ PASS | 200 | 1823ms | - |
| List Visits | GET | ✅ PASS | 200 | 1457ms | - |
| Active SOS | GET | ✅ PASS | 200 | 552ms | - |
| List Beats | GET | ✅ PASS | 200 | 1600ms | - |
| List Roles | GET | ✅ PASS | 200 | 919ms | - |
| List Users | GET | ✅ PASS | 200 | 4568ms | - |
| Audit Logs | GET | ❌ FAIL | 500 | -ms | `{"success":false,"error":{"message":"Internal Serv...` |
| List Notifications | GET | ✅ PASS | 200 | 1194ms | - |
| Dashboard Stats | GET | ✅ PASS | 200 | 2396ms | - |
| Master Districts | GET | ✅ PASS | 200 | 923ms | - |
| Master Police Stations | GET | ✅ PASS | 200 | 283ms | - |
