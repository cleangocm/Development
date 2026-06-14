# 📱 UltraWash — Full Application Documentation

> **Version:** 1.0.0  
> **Platform:** Flutter (Android & iOS)  
> **State Management:** GetX  
> **Last Updated:** February 22, 2026

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Project Architecture](#3-project-architecture)
4. [Folder Structure](#4-folder-structure)
5. [Core Services](#5-core-services)
6. [Feature Modules](#6-feature-modules)
   - [Authentication](#61-authentication)
   - [Home](#62-home)
   - [Add Service](#63-add-service)
   - [Cloth Type Selection](#64-cloth-type-selection)
   - [Place Your Order](#65-place-your-order)
   - [Checkout](#66-checkout)
   - [Payment](#67-payment)
   - [Orders](#68-orders)
   - [Track Order](#69-track-order)
   - [Chat Token / Support Tickets](#610-chat-token--support-tickets)
   - [Profile](#611-profile)
   - [Bottom Navigation](#612-bottom-navigation)
7. [Data Models](#7-data-models)
8. [API Reference](#8-api-reference)
9. [Theming & Design System](#9-theming--design-system)
10. [Reusable Widgets](#10-reusable-widgets)
11. [Third-Party Integrations](#11-third-party-integrations)
12. [App Flow Diagrams](#12-app-flow-diagrams)
13. [Configuration & Environment](#13-configuration--environment)
14. [Build & Run Instructions](#14-build--run-instructions)

---

## 1. Project Overview

**UltraWash** is a full-featured laundry service mobile application built with Flutter. It allows users to browse laundry services (wash & fold, dry cleaning, ironing, stain removal, etc.), select cloth types, place orders, make payments via Stripe, track orders in real-time, manage their profile, and create support tickets.

### Key Features

| Feature | Description |
|---|---|
| **User Authentication** | Email/password login, registration, Google Sign-In, forgot/reset password with OTP |
| **Service Browsing** | Browse Regular & Special laundry services with detailed item lists |
| **Order Placement** | Select cloths, set quantities, build order, apply coupons |
| **Checkout & Payment** | Billing/shipping info, Stripe integration, coupon validation |
| **Order Management** | View all orders, filter by status (Ongoing/Complete/Canceled) |
| **Order Tracking** | Real-time tracking timeline with step-by-step status updates |
| **Order Cancellation** | Cancel pending orders with confirmation dialog |
| **Profile Management** | View/edit profile, upload photo via ImgBB, change password |
| **Coupons** | Browse active coupons, copy codes, apply at checkout |
| **Support Tickets** | Create support tickets with priority/category, view ticket list |
| **Theme Support** | Light and Dark mode with dynamic color switching |
| **Session Management** | Token persistence via SharedPreferences, auto-logout on 401 |

---

## 2. Tech Stack & Dependencies

### Framework
- **Flutter** SDK `^3.9.2`
- **Dart** (latest stable)

### State Management
- **GetX** `^4.7.3` — Routing, state management, dependency injection

### Networking
- **Dio** `^5.9.1` — HTTP client with interceptors
- **http** `^1.6.0` — Additional HTTP support

### UI & Design
- **flutter_screenutil** `^5.9.3` — Responsive design scaling
- **flutter_svg** `^2.0.10` — SVG asset rendering
- **google_fonts** `^6.1.0` — Custom typography
- **gradient_borders** `^1.0.2` — Gradient border decorations
- **iconsax** `^0.0.8` — Icon pack

### Authentication
- **google_sign_in** `^6.2.1` — Google OAuth sign-in

### Payment
- **flutter_stripe** `^12.3.0` — Stripe payment integration

### Storage
- **shared_preferences** `^2.5.4` — Local key-value storage

### Media
- **image_picker** `^1.0.7` — Camera/gallery image selection

### Utilities
- **logger** `^2.6.2` — Structured console logging
- **intl** `^0.20.2` — Date/number formatting

### Dev Dependencies
- **flutter_lints** `^5.0.0` — Linting rules
- **flutter_launcher_icons** `^0.14.4` — App icon generation

---

## 3. Project Architecture

The app follows a **feature-first** architecture with the GetX pattern:

```
┌──────────────────────────────────────────────────────┐
│                    main.dart                         │
│  (App Entry, Stripe Init, SharedPrefs, GetMaterialApp)│
├──────────────────────────────────────────────────────┤
│               Controller_Binding.dart                │
│  (Global dependency injection for all controllers)   │
├──────────────────────────────────────────────────────┤
│                    core/                             │
│  ┌─────────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ NetworkClient│  │ Session  │  │ SharedPrefs    │  │
│  │   (Dio)     │  │ (Token)  │  │ (Persistence)  │  │
│  └─────────────┘  └──────────┘  └────────────────┘  │
│        ↕                                             │
│  ┌─────────────┐                                     │
│  │NetworkService│ ← API base URL + auth headers      │
│  └─────────────┘                                     │
├──────────────────────────────────────────────────────┤
│                   feature/                           │
│  Each feature module contains:                       │
│  ┌──────────┐  ┌────────────┐  ┌────────┐           │
│  │ model/   │  │ controller/│  │ screen/│           │
│  │(Data DTOs)│ │ (GetX Ctrl)│  │ (UI)   │           │
│  └──────────┘  └────────────┘  └────────┘           │
│                                ┌────────┐           │
│                                │ widget/│           │
│                                │(Reusable)│          │
│                                └────────┘           │
├──────────────────────────────────────────────────────┤
│                     app/                             │
│  ┌────────┐ ┌───────┐ ┌────────┐ ┌──────────────┐   │
│  │ Colors │ │Assets │ │Widgets │ │ Resource (R) │   │
│  │(KColors)│ │(paths)│ │(WText, │ │ (R.color.x)  │   │
│  │        │ │       │ │WButton)│ │              │   │
│  └────────┘ └───────┘ └────────┘ └──────────────┘   │
└──────────────────────────────────────────────────────┘
```

### Design Principles
- **Feature-first organization** — Each feature is self-contained with its own model, controller, screen, and widgets
- **Separation of concerns** — Network layer, session management, and UI are fully decoupled
- **Reactive state** — All controllers use `Rx` observables, UI reacts via `Obx()`
- **Global DI** — Controllers are registered once in `ControllerBinding` and available app-wide

---

## 4. Folder Structure

```
lib/
├── main.dart                          # App entry point
├── Controller_Binding.dart            # Global GetX dependency injection
│
├── app/                               # Shared app-level resources
│   ├── assets.dart                    # Static asset path constants
│   ├── color.dart                     # KColors — theme-aware color definitions
│   ├── resource.dart                  # R class (R.color.xxx access pattern)
│   ├── theme_controller.dart          # Theme mode controller
│   ├── utils.dart                     # Utility functions
│   ├── loading.dart                   # Loading indicator widget
│   ├── fild_title.dart                # Field title widget
│   ├── widget_button.dart             # WButton — reusable button component
│   ├── winput_text.dart               # InputFieldText — reusable text field
│   └── wtext.dart                     # WText — reusable text widget
│
├── core/                              # Core infrastructure
│   └── service/
│       ├── api_service/
│       │   └── api_service.dart       # NetworkService (Dio client wrapper)
│       ├── network/
│       │   ├── network_client.dart    # NetworkClient (GET/POST/PUT/PATCH/DELETE/Upload)
│       │   └── network_responce.dart  # NetworkResponse model
│       ├── session/
│       │   └── session.dart           # Session (in-memory token cache)
│       └── shared_preferance/
│           └── shared_prefarance.dart # SharedPrefs (persistent token/user storage)
│
├── feature/                           # Feature modules
│   ├── auth/                          # Authentication feature
│   │   └── ui/
│   │       ├── controller/
│   │       │   └── auth_controller.dart
│   │       └── screen/
│   │           ├── splash_screen.dart
│   │           ├── splash_find_screen.dart
│   │           ├── login_screen.dart
│   │           ├── sign_up_screen.dart
│   │           ├── forgot_password_screen.dart
│   │           ├── otp_screen.dart
│   │           └── create_new_password_screen.dart
│   │
│   ├── Home/                          # Home / Dashboard
│   │   └── ui/
│   │       ├── screen/
│   │       │   └── home_screen.dart
│   │       └── widget/
│   │           └── home_service_card.dart
│   │
│   ├── Add/                           # Add Service (browse services)
│   │   ├── model/
│   │   │   ├── add_service_model.dart       # ServiceModel
│   │   │   └── AddServiceSlagModel.dart     # AddServiceSlagModel (slug details)
│   │   └── UI/
│   │       ├── controller/
│   │       │   └── add_service_controller.dart
│   │       ├── screen/
│   │       │   └── add_screen.dart
│   │       └── widget/
│   │           └── service_card_widget.dart
│   │
│   ├── Cloth type/                    # Cloth type selection
│   │   ├── model/
│   │   │   └── service_order_model.dart     # ServiceOrder, OrderItem
│   │   └── UI/
│   │       ├── screen/
│   │       │   └── Select_Cloth_type_screen.dart
│   │       └── widget/
│   │           └── cloth_item_card.dart
│   │
│   ├── your Order/                    # Place Your Order
│   │   └── UI/
│   │       ├── screen/
│   │       │   └── Place_your_Order_screen.dart
│   │       └── widget/
│   │           └── order_category_card.dart
│   │
│   ├── checkout/                      # Checkout flow
│   │   ├── model/
│   │   │   └── checkout_models.dart
│   │   └── UI/
│   │       ├── screen/
│   │       │   └── checkout_screen.dart
│   │       └── widget/
│   │           ├── change_billing_bottom_sheet.dart
│   │           └── change_shipping_bottom_sheet.dart
│   │
│   ├── Payment/                       # Payment processing
│   │   └── UI/
│   │       ├── screen/
│   │       │   └── Payment_screen.dart
│   │       └── widget/
│   │           ├── add_card_bottom_sheet.dart
│   │           └── order_success_dialog.dart
│   │
│   ├── order/                         # Order management
│   │   ├── model/
│   │   │   ├── order_model.dart             # AllOrderModel
│   │   │   └── each_order_model.dart        # EachOrderMOdel
│   │   └── ui/
│   │       ├── controller/
│   │       │   └── order_controller.dart
│   │       ├── screen/
│   │       │   └── order_screen.dart
│   │       └── widget/
│   │           ├── order_card.dart
│   │           └── cancel_order_dialog.dart
│   │
│   ├── track order/                   # Order tracking
│   │   └── ui/
│   │       ├── screen/
│   │       │   └── track_order.dart
│   │       └── widget/
│   │           ├── tracking_timeline_widget.dart
│   │           └── expandable_order_section.dart
│   │
│   ├── Chat Token/                    # Support tickets
│   │   ├── model/
│   │   │   └── chat_model.dart              # ChatTickestModel
│   │   └── UI/
│   │       ├── controller/
│   │       │   └── chat_token_conteroller.dart
│   │       ├── Screen/
│   │       │   └── chat_Token_List_screen.dart
│   │       └── widget/
│   │           └── add_chat_token_bottom_sheet.dart
│   │
│   ├── profile/                       # User profile
│   │   ├── model/
│   │   │   ├── ProfileModel.dart            # ProfileModel
│   │   │   └── coupon_model.dart            # CoupomModel
│   │   └── UI/
│   │       ├── controller/
│   │       │   └── profile_controller.dart
│   │       ├── screen/
│   │       │   ├── profile_screen.dart
│   │       │   └── coupon_screen.dart
│   │       └── widgets/
│   │           ├── profile_card.dart
│   │           ├── profile_menu_item.dart
│   │           ├── personal_information_bottom_sheet.dart
│   │           ├── address_bottom_sheet.dart
│   │           ├── change_password_bottom_sheet.dart
│   │           └── coupon_card.dart
│   │
│   └── bottomNavigation.dart          # Bottom navigation bar + controller
```

---

## 5. Core Services

### 5.1 NetworkClient (`core/service/network/network_client.dart`)

Central HTTP client built on **Dio** with:

| Feature | Details |
|---|---|
| **Base URL** | `http://192.168.10.64:3000/api/v1` |
| **Auto headers** | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <token>` |
| **Methods** | `getRequest()`, `postRequest()`, `putRequest()`, `patchRequest()`, `deleteRequest()`, `uploadRequest()` |
| **401 Handling** | Automatic — clears session, navigates to LoginScreen, shows "Session Expired" snackbar |
| **Logging** | Full request/response logging via `logger` package |
| **Timeouts** | Connect: 15s, Receive: 20s, Send: 20s |
| **Error handling** | Graceful — returns `NetworkResponse` with `isSuccess`, `statusCode`, `errorMessage`, `responseData` |

### 5.2 NetworkResponse (`core/service/network/network_responce.dart`)

```dart
class NetworkResponse {
  final bool isSuccess;
  final int statusCode;
  final String? errorMessage;
  final dynamic responseData;
}
```

### 5.3 Session (`core/service/session/session.dart`)

In-memory static token cache for synchronous header access:

```dart
class Session {
  static String? accessToken;
  static void setToken(String? token);
  static void clear();
}
```

### 5.4 SharedPrefs (`core/service/shared_preferance/shared_prefarance.dart`)

Persistent storage using `shared_preferences`:

| Method | Description |
|---|---|
| `saveToken(String)` | Persists JWT token + syncs to `Session` |
| `getToken()` | Reads token from disk + primes `Session` cache |
| `saveUser(Map)` | Persists user data as JSON string |
| `getUser()` | Reads user data from disk |
| `clear()` | Clears all stored data + `Session` cache |

### 5.5 NetworkService (`core/service/api_service/api_service.dart`)

Wrapper that creates `NetworkClient` with:
- Base URL configuration
- Dynamic header builder (reads token from `Session.accessToken`)
- 401 handler (clears storage, navigates to login)

---

## 6. Feature Modules

### 6.1 Authentication

**Controller:** `AuthController`  
**Screens:** Splash → SplashFind → Login / SignUp → ForgotPassword → OTP → CreateNewPassword

#### AuthController Methods

| Method | API | Description |
|---|---|---|
| `login()` | `POST /auth/login` | Email/phone + password login |
| `register()` | `POST /auth/register` | New user registration |
| `googleLogin()` | `POST /auth/google` | Google OAuth with Firebase ID token |
| `forgotPassword()` | `POST /auth/forgot-password` | Send OTP to email/phone |
| `verifyForgotOtp()` | `POST /auth/verify-forgot-otp` | Verify OTP, get reset token |
| `resetPassword()` | `POST /auth/reset-password` | Reset password with token |
| `logout()` | `POST /auth/logout` | Logout + clear local storage |
| `isLoggedIn()` | — | Check if token exists in storage |
| `loadCurrentUser()` | — | Load user from SharedPreferences |

#### Auth Flow

```
┌──────────┐    ┌─────────────┐    ┌─────────────┐
│  Splash  │───►│ SplashFind  │───►│   Login     │
│ (2 sec)  │    │ (Get Started)│    │  Screen     │
└──────────┘    └─────────────┘    └──────┬──────┘
                                          │
                          ┌───────────────┼───────────────┐
                          ▼               ▼               ▼
                   ┌────────────┐  ┌────────────┐  ┌──────────────┐
                   │  Sign Up   │  │  Google     │  │   Forgot     │
                   │  Screen    │  │  Login      │  │  Password    │
                   └─────┬──────┘  └─────┬──────┘  └──────┬───────┘
                         │               │                 ▼
                         │               │          ┌────────────┐
                         │               │          │ OTP Screen │
                         │               │          └──────┬─────┘
                         │               │                 ▼
                         │               │          ┌────────────────┐
                         │               │          │ Create New     │
                         │               │          │ Password       │
                         │               │          └───────┬────────┘
                         ▼               ▼                  │
                   ┌──────────────────────────────┐         │
                   │   Login Screen               │◄────────┘
                   └──────────────┬───────────────┘
                                 ▼
                   ┌──────────────────────────────┐
                   │   Bottom Navigation (Home)   │
                   └──────────────────────────────┘
```

#### Session Persistence
- On successful login/register/google-login: token is saved via `SharedPrefs.saveToken()`, user data via `SharedPrefs.saveUser()`
- On app start: `SharedPrefs.getToken()` is called in `main()` before controllers initialize
- If token exists: navigates directly to `BottomNavigation`
- If token missing: navigates to `LoginScreen`
- On 401 response: auto-logout, redirect to `LoginScreen`

---

### 6.2 Home

**Screen:** `HomeScreen`  
**Widgets:** `HomeServiceCard`

The Home screen displays:
- User greeting with profile name and avatar (from `ProfileControllers.getProfile()`)
- Promotional banner slider (3 slides using `Assets.Slider` image)
- **Regular Services** section (category ≠ special/premium)
- **Special Services** section (category = special/premium)
- Ongoing and Complete order counts (from `OrderControllers.getMyOrders()`)

Clicking a service card navigates to `SelectClothTypeScreen` with the service slug.

---

### 6.3 Add Service

**Controller:** `AddServiceControllers`  
**Screen:** `AddScreen`  
**Widgets:** `ServiceCardWidget`  
**Models:** `ServiceModel`, `AddServiceSlagModel`

#### AddServiceControllers Methods

| Method | API | Description |
|---|---|---|
| `getAllServices()` | `GET /services` | Fetches all services, auto-filters into regular/special |
| `getServiceBySlug(slug)` | `GET /services/:slug` | Fetches detailed service with items list |
| `validateCoupon(code, amount)` | `POST /coupons/validate` | Validates coupon code at checkout |
| `placeOrder(...)` | `POST /orders` | Creates a new order with items, billing, shipping, payment |

#### Service Categories

| Category Type | Filter Logic |
|---|---|
| **Regular Services** | `category` ≠ `special` AND ≠ `premium` (washing, dry_cleaning, ironing, etc.) |
| **Special Services** | `category` = `special` OR `premium` |

#### Service Card Colors (Gradient)

| Position | Colors |
|---|---|
| Card 1 | `lightSkyBlue` — `#8FD4FF` → `#B8E4FF` |
| Card 2 | `lavender` — `#E4C9FF` → `#F0DEFF` |
| Card 3 | `paleBlue` — `#DBE5FF` → `#ECF1FF` |
| Card 4 | `creamYellow` — `#FFF9C7` → `#FFFBDB` |

---

### 6.4 Cloth Type Selection

**Screen:** `SelectClothTypeScreen`  
**Widgets:** `ClothItemCard`  
**Model:** `ServiceOrder`, `OrderItem`

Flow:
1. Receives service slug from `AddScreen` or `HomeScreen`
2. Calls `AddServiceControllers.getServiceBySlug(slug)` to load items
3. Displays item cards with images, names, prices
4. Users tap "Add" to add first item, then `−` / `+` controls appear
5. Confirm button creates a `ServiceOrder` and navigates to `PlaceYourOrderScreen`

---

### 6.5 Place Your Order

**Screen:** `PlaceYourOrderScreen`  
**Widgets:** `OrderCategoryCard`

Displays confirmed orders with:
- Service name + item count header
- Itemized list with quantities and names
- Delete order button
- "Add More" button (returns to `AddScreen` with existing orders preserved)
- "Place Order" button → navigates to `CheckoutScreen`

---

### 6.6 Checkout

**Screen:** `CheckoutScreen`  
**Widgets:** `ChangeBillingBottomSheet`, `ChangeShippingBottomSheet`

Components:
- **Billing Info Card** — Name, email, phone, alternative phone, address, additional instructions
- **Shipping Info Card** — Same structure, option to copy from billing or change separately
- **Order Summary Card** — Subtotal (calculated from items), shipping fee (static), coupon input + apply, discount display, total
- **Checkout Button** → navigates to `PaymentScreen`

#### Coupon Validation

```
POST /coupons/validate
Body: { "code": "SAVE20", "orderAmount": 500 }
Response: { discount, finalAmount, coupon: { code, discountType, discountValue } }
```

---

### 6.7 Payment

**Screen:** `PaymentScreen`  
**Widgets:** `AddCardBottomSheet`, `OrderSuccessDialog`

Payment methods:
- **Stripe** (card payment with `flutter_stripe`)
- **Cash on Delivery (COD)**

#### Stripe Integration

| Config | Value |
|---|---|
| Publishable Key | `pk_test_51SwH2S0BRjy0fFY4...` |
| Secret Key | `sk_test_51SwH2S0BRjy0fFY4...` |

#### Order Creation

```
POST /orders
Body: {
  items: [...],
  billingInfo: {...},
  shippingInfo: {...},
  schedule: {...},
  deliveryType: "standard",
  paymentMethod: "stripe" | "cod",
  couponCode: "SAVE20",
  couponDiscount: 50
}
```

On success → shows `OrderSuccessDialog` → navigates to `OrderScreen`.

---

### 6.8 Orders

**Controller:** `OrderControllers`  
**Screen:** `OrderScreen`  
**Widgets:** `OrderCard`, `CancelOrderDialog`  
**Models:** `AllOrderModel`, `EachOrderMOdel`

#### OrderControllers Methods

| Method | API | Description |
|---|---|---|
| `getMyOrders()` | `GET /orders/my-orders` | Fetch all user orders |
| `getOrderById(id)` | `GET /orders/:id` | Fetch single order details |
| `cancelOrder(id)` | `PUT /orders/:id/cancel` | Cancel a pending order |

#### Order Filters

| Filter | Matching Statuses |
|---|---|
| **All** | All orders |
| **Ongoing** | `pending`, `confirmed`, `picked_up`, `in_progress`, `ongoing` |
| **Complete** | `completed`, `complete`, `delivered` |
| **Canceled** | `cancelled`, `canceled` |

#### Filter Badge Colors

| Filter | Color |
|---|---|
| Ongoing | Default theme |
| Canceled | `#ED9495` |
| Complete | `#0F7BA0` |

---

### 6.9 Track Order

**Screen:** `TrackOrderScreen`  
**Widgets:** `TrackingTimelineWidget`, `ExpandableOrderSection`

Displays:
- Order ID and status badge (color `#94EDA1`)
- Order date and estimated delivery date
- Discount and total payment
- **Tracking Timeline** — Visual step-by-step progress:
  - Order Confirmed → Pickup Assigned → Picked Up → At Warehouse → Cleaning In Progress → Cleaned & Ready → Out for Delivery → Delivered
  - Completed steps shown in green (`emeraldGreen`), pending in gray
- **Expandable Order Items** — Grouped by service, tap to expand/collapse

---

### 6.10 Chat Token / Support Tickets

**Controller:** `ChatTokenControllers`  
**Screen:** `ChatTokenListScreen`  
**Widgets:** `AddChatTokenBottomSheet`  
**Model:** `ChatTickestModel`

#### ChatTokenControllers Methods

| Method | API | Description |
|---|---|---|
| `getMyTickets()` | `GET /tickets/my-tickets` | Fetch all user tickets |
| `createTicket(...)` | `POST /tickets` | Create a new support ticket |

#### Ticket Categories (API-accepted values)
- `order_issue`
- `service_quality`
- `delivery`
- `payment`
- `other`

#### Ticket Priorities
- `low`
- `medium`
- `high`
- `urgent`

#### Ticket Card Design
- Width: 380, Height: 70
- Border-radius: 8px, Padding: 8px
- Background: `#FFFFFF`, Box-shadow: `0px 0px 4px 0px #00000033`

---

### 6.11 Profile

**Controller:** `ProfileControllers`  
**Screens:** `ProfileScreen`, `CouponScreen`  
**Widgets:** `ProfileCard`, `ProfileMenuItem`, `PersonalInformationBottomSheet`, `AddressBottomSheet`, `ChangePasswordBottomSheet`, `CouponCard`  
**Models:** `ProfileModel`, `CoupomModel`

#### ProfileControllers Methods

| Method | API | Description |
|---|---|---|
| `getProfile()` | `GET /auth/profile` | Fetch user profile data |
| `updateProfile(...)` | `PUT /auth/profile` | Update name, phone, address, profileImage |
| `uploadImage(File)` | ImgBB API (direct) | Upload image to ImgBB, returns URL |
| `changePassword(...)` | `PUT /auth/change-password` | Change user password |
| `getActiveCoupons()` | `GET /coupons/active` | Fetch active coupons |

#### Profile Screen Menu Items

| Group 1 (Card) | Group 2 (Card) |
|---|---|
| Personal Information → Bottom Sheet | Change Password → Bottom Sheet |
| Address → Bottom Sheet (read-only) | Notification → Toggle |
| Payment Methods → Bottom Sheet | Language → Shows "English" |
| Coupon → CouponScreen | Theme → Light/Dark toggle |
| | Currency → Shows "Dollar" |
| | Privacy Policy |
| | Terms & Condition |

#### Image Upload Flow
1. User taps profile image section
2. Chooses "Open Gallery" or "Open Camera"
3. Image picked via `image_picker`
4. Image converted to base64 → uploaded directly to ImgBB API (`https://api.imgbb.com/1/upload`)
5. ImgBB returns URL
6. URL sent to `PUT /auth/profile` with `profileImage` field
7. Profile refreshed after update

#### Profile Data (from API)

```json
{
  "status": "success",
  "data": {
    "_id": "6789abc...",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+8801712345678",
    "role": "user",
    "address": "Gulshan-2, Dhaka",
    "profileImage": "https://i.ibb.co/xxxxx/avatar.jpg",
    "isVerified": true,
    "createdAt": "2025-01-10T12:00:00Z"
  }
}
```

---

### 6.12 Bottom Navigation

**File:** `bottomNavigation.dart`  
**Controller:** `NavigationController`

| Tab | Icon | Screen | Index |
|---|---|---|---|
| Home | `home.svg` | `HomeScreen` | 0 |
| Add | `add.svg` | `AddScreen` | 1 |
| Orders | `order.svg` | `OrderScreen` | 2 |
| Chat | `chat.svg` | `ChatTokenListScreen` | 3 |
| Profile | `user.svg` | `ProfileScreen` | 4 |

#### Design Specs

| Property | Value |
|---|---|
| Container Width | 380 |
| Container Height | 88 |
| Border Radius | 60px |
| Background | `R.color.iceBlue` (`#F3F7FF` light / `#1E1E1E` dark) |
| Selected Tab | `R.color.oceanBlue` (`#0F7BA0`) background, white icon/text |
| Unselected Tab | `R.color.coolGray` icon/text |
| Selected Tab Size | 80w × 72h with 40px border-radius |

---

## 7. Data Models

### 7.1 ProfileModel

```dart
class ProfileModel {
  String? status;
  Data? data;         // _id, name, email, phone, role, address, profileImage, isVerified, createdAt
}
```

### 7.2 ServiceModel (`add_service_model.dart`)

```dart
class ServiceModel {
  String? status;
  List<Data>? data;   // _id, name, slug, description, shortDescription, image,
                      // pricingType, pricePerKg, pricePerItem, estimatedDays,
                      // category, items[]
}
```

### 7.3 AddServiceSlagModel

```dart
class AddServiceSlagModel {
  String? status;
  Data? data;         // Full service detail with items[] (name, description, price, image)
}
```

### 7.4 ServiceOrder / OrderItem (`service_order_model.dart`)

```dart
class ServiceOrder {
  String serviceId, serviceName, serviceSlug;
  List<OrderItem> items;
  int get totalItems;     // sum of all item quantities
  double get totalPrice;  // sum of (price × quantity)
}

class OrderItem {
  String itemId, itemName;
  double price;
  String? image;
  int quantity;
}
```

### 7.5 AllOrderModel (`order_model.dart`)

```dart
class AllOrderModel {
  String? status;
  List<Data>? data;   // _id, orderId, status, totalPayment, paymentMethod,
                      // paymentStatus, itemCount, itemsSummary, orderDate, items[]
}
```

### 7.6 EachOrderMOdel (`each_order_model.dart`)

```dart
class EachOrderMOdel {
  String? status;
  Data? data;         // Full order details including:
                      // items[], billingInfo, shippingInfo, schedule,
                      // trackingSteps[], pickupDeliveryBoy, deliveryBoy,
                      // discount, subtotal, totalPayment, deliveryDate, etc.
}
```

### 7.7 ChatTickestModel (`chat_model.dart`)

```dart
class ChatTickestModel {
  String? status;
  Data? data;         // tickets[], total, page, totalPages
                      // Each ticket: _id, subject, description, category,
                      // priority, status, tokenNumber, notes[], createdAt
}
```

### 7.8 CoupomModel (`coupon_model.dart`)

```dart
class CoupomModel {
  String? status;
  List<Data>? data;   // code, title, discountType, discountValue, maxDiscount,
                      // minOrderValue, expiryDate, isActive
}
```

---

## 8. API Reference

**Base URL:** `http://192.168.10.64:3000/api/v1`

### 8.1 Authentication APIs

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `POST` | `/auth/register` | `{ name, email, phone, password, confirmPassword }` | `{ status, message, token, user }` |
| `POST` | `/auth/login` | `{ emailOrPhone, password }` | `{ status, message, token, user }` |
| `POST` | `/auth/google` | `{ idToken }` | `{ status, token, user }` |
| `POST` | `/auth/logout` | `{}` | `{ status, message }` |
| `POST` | `/auth/forgot-password` | `{ emailOrPhone }` | `{ status, message }` |
| `POST` | `/auth/verify-forgot-otp` | `{ emailOrPhone, otp }` | `{ status, message, resetToken }` |
| `POST` | `/auth/reset-password` | `{ emailOrPhone, newPassword, confirmPassword, resetToken }` | `{ status, message }` |

### 8.2 Profile APIs

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `GET` | `/auth/profile` | — | `{ status, data: { _id, name, email, phone, ... } }` |
| `PUT` | `/auth/profile` | `{ name, phone, address, profileImage }` | `{ status, message, data }` |
| `PUT` | `/auth/change-password` | `{ currentPassword, newPassword, confirmPassword }` | `{ status, message }` |

### 8.3 Service APIs

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `GET` | `/services` | — | `{ status, data: [{ _id, name, slug, category, items[], ... }] }` |
| `GET` | `/services/:slug` | — | `{ status, data: { _id, name, items[], ... } }` |

### 8.4 Order APIs

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `POST` | `/orders` | `{ items[], billingInfo, shippingInfo, paymentMethod, couponCode, ... }` | `{ status, data: { _id, orderId, status, totalAmount } }` |
| `GET` | `/orders/my-orders` | — | `{ status, data: [orders] }` |
| `GET` | `/orders/:id` | — | `{ status, data: { full order details + trackingSteps } }` |
| `PUT` | `/orders/:id/cancel` | `{}` | `{ status, message }` |

### 8.5 Coupon APIs

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `POST` | `/coupons/validate` | `{ code, orderAmount }` | `{ status, data: { valid, discount, finalAmount, coupon } }` |
| `GET` | `/coupons/active` | — | `{ status, data: [coupons] }` |

### 8.6 Ticket APIs

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `POST` | `/tickets` | `{ subject, description, category, priority }` | `{ status, data: { _id, subject, status, priority } }` |
| `GET` | `/tickets/my-tickets` | — | `{ status, data: { tickets[], total, page, totalPages } }` |

### 8.7 Upload API

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `POST` | `/upload/imgbb` | `FormData (image file)` | `{ status, data: { url, deleteUrl } }` |

> **Note:** Image upload is now done directly to ImgBB API (`https://api.imgbb.com/1/upload`) with API key `062499640037b87a330cb09793b95435`, bypassing the backend upload endpoint.

---

## 9. Theming & Design System

### 9.1 Color System

Colors are managed through `KColors` class accessed via `R.color.xxx`.

#### Primary Colors (Static)

| Name | Hex | Usage |
|---|---|---|
| `oceanBlue` | `#0F7BA0` | Primary accent, nav selected, buttons |
| `tealOcean` | `#1B7F8F` | Secondary accent, links |
| `coral` | `#FF6B6B` | Danger/delete actions |
| `emeraldGreen` | `#0FA02A` | Success states, tracking completed |
| `mintGreen2` | `#94EDA1` | Status badge |
| `crimsonRed` | `#D20000` | Error states |
| `coolGray2` | `#9BAAC0` | Hint text, secondary icons |
| `charcoal1` | `#171A20` | Section headers |

#### Theme-Responsive Colors

| Name | Light | Dark |
|---|---|---|
| `white` | `#FFFFFF` | `#121212` |
| `black` | `#000000` | `#FFFFFF` |
| `background` | `#FDFDFD` | `#022531` |
| `cardBackground` | `#FFFFFF` | `#1E1E1E` |
| `iceBlue` | `#F3F7FF` | `#1E1E1E` |
| `deepTeal` | `#FFFFFF` | `#043242` |
| `charcoal` | `#171A20` | `#FFFFFF` |
| `primaryText` | `#333333` | `#FFFFFF` |
| `secondaryText` | `#666666` | `#FFFFFF (70%)` |

### 9.2 Design Tokens

| Token | Value |
|---|---|
| Design Size | 412 × 917 (ScreenUtil) |
| Default Border Radius | 8px (inputs, buttons), 16px (cards), 60px (nav bar) |
| Card Shadow | `0px 0px 4px 0px #00000033` |
| Input Border | `1px solid #616A88` |
| Label Color | `#49454F` |
| Hint Color | `#9BAAC0` |

---

## 10. Reusable Widgets

### 10.1 WText

Custom text widget with configurable:
- `text`, `fontSize`, `fontWeight`, `color`
- `textDecoration`, `maxLines`, `textAlign`

### 10.2 WButton

Versatile button with decoration types:

| Type | Description |
|---|---|
| `DecorationType.primary` | Solid filled button |
| `DecorationType.primaryStroke` | Outlined button |
| `DecorationType.textOnly` | Text-only button |
| `DecorationType.solid` | Solid with custom color |
| `DecorationType.stroke` | Outlined with custom color |

Properties: `label`, `onPressed`, `isLoading`, `width`, `height`, `radius`, `buttonColor`, `textColor`, `iconWidget`, `isEnabled`

### 10.3 InputFieldText

Feature-rich text input with:
- `textEditingController`, `labelText`, `hintText`
- `keyboardType`, `isPassword` (toggle visibility)
- `prefixIcon`, `suffixIcon`
- `onChanged`, `validator`
- Consistent border styling (`#616A88`)
- Height: 48px

### 10.4 ServiceCardWidget

Reusable service card for Add/Home screens:
- Gradient background colors
- Service image (80×80)
- Service name and short description
- Card dimensions: 182×177 (Add), 182×136 (Home)

### 10.5 OrderCategoryCard

Order summary card showing:
- Service name + item count
- Delete button
- Expandable item list with quantities

### 10.6 TrackingTimelineWidget

Visual timeline with:
- Green circle + line for completed steps
- Gray circle + line for pending steps
- Step title and date

### 10.7 ExpandableOrderSection

Collapsible order section with:
- Service category header
- Arrow toggle (up/down)
- Item list with `quantity X itemName` format

### 10.8 CouponCard

Coupon display card with copy-to-clipboard functionality

### 10.9 ProfileCard / ProfileMenuItem

Profile screen building blocks for menu items with icons, titles, and optional values

---

## 11. Third-Party Integrations

### 11.1 Stripe Payment

| Config | Value |
|---|---|
| **Package** | `flutter_stripe: ^12.3.0` |
| **Publishable Key** | `pk_test_51SwH2S0BRjy0fFY4...` |
| **Android Requirement** | `FlutterFragmentActivity` (not `FlutterActivity`) |
| **Init** | `Stripe.publishableKey = '...'` + `Stripe.instance.applySettings()` in `main()` |

### 11.2 Google Sign-In

| Config | Value |
|---|---|
| **Package** | `google_sign_in: ^6.2.1` |
| **Scopes** | `email`, `profile` |
| **Flow** | Google sign-in → get `idToken` → send to `POST /auth/google` → receive JWT |

### 11.3 ImgBB Image Upload

| Config | Value |
|---|---|
| **API URL** | `https://api.imgbb.com/1/upload` |
| **API Key** | `062499640037b87a330cb09793b95435` |
| **Method** | Image → base64 encode → POST FormData → receive `display_url` |

---

## 12. App Flow Diagrams

### 12.1 Complete User Journey

```
App Launch
    │
    ▼
Splash Screen (2s)
    │
    ▼
Check Token (SharedPrefs)
    │
    ├── Token exists ──────────► Bottom Navigation (Home)
    │
    └── No token ──────────────► Splash Find Screen
                                      │
                                      ▼
                                 Login Screen
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
              Login (email)    Google Login        Sign Up
                    │                 │                 │
                    └─────────────────┴─────────────────┘
                                      │
                                      ▼
                              Bottom Navigation
                    ┌────┬────┬────┬────┬────┐
                    │Home│Add │Order│Chat│Prof│
                    └────┴────┴────┴────┴────┘
```

### 12.2 Order Placement Flow

```
Home Screen / Add Screen
    │
    ▼ (Tap service)
Select Cloth Type Screen
    │ (Select items, set quantities)
    ▼
Place Your Order Screen
    │ (Review order, add more if needed)
    ▼
Checkout Screen
    │ (Billing, Shipping, Apply coupon)
    ▼
Payment Screen
    │ (Stripe card / COD)
    ▼
Order Success Dialog
    │
    ▼
Order Screen (My Orders)
    │ (Tap order)
    ▼
Track Order Screen
```

### 12.3 Profile Management Flow

```
Profile Screen
    │
    ├── Personal Info ──► Bottom Sheet (Edit name, phone, address, photo)
    ├── Address ────────► Bottom Sheet (View only)
    ├── Payment Methods ► Bottom Sheet (View saved cards)
    ├── Coupon ─────────► Coupon Screen (View/copy active coupons)
    ├── Change Password ► Bottom Sheet (Current + New + Confirm)
    ├── Theme ──────────► Toggle Light/Dark mode
    └── Logout ─────────► Clear session → Login Screen
```

---

## 13. Configuration & Environment

### 13.1 API Base URL

```dart
// In: core/service/api_service/api_service.dart
baseUrl: 'http://192.168.10.64:3000/api/v1'
```

### 13.2 Stripe Keys

```dart
// In: main.dart
Stripe.publishableKey = 'pk_test_51SwH2S0BRjy0fFY4...';
// Secret key used server-side: sk_test_51SwH2S0BRjy0fFY4...
```

### 13.3 ImgBB API Key

```dart
// In: profile_controller.dart
'key': '062499640037b87a330cb09793b95435'
```

### 13.4 Android Configuration

| File | Setting |
|---|---|
| `AndroidManifest.xml` | Internet permission enabled |
| `MainActivity` | Must extend `FlutterFragmentActivity` (for Stripe) |
| `build.gradle` | `minSdkVersion` ≥ 21 |

### 13.5 ScreenUtil Design Size

```dart
ScreenUtilInit(
  designSize: const Size(412, 917),
  minTextAdapt: true,
  splitScreenMode: true,
)
```

---

## 14. Build & Run Instructions

### Prerequisites
- Flutter SDK `^3.9.2`
- Android Studio or VS Code
- Android device/emulator or iOS simulator
- Backend server running at configured API base URL

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/ripannaasmind/mobileApp_ultra_wash.git

# 2. Navigate to project
cd ultraWash

# 3. Install dependencies
flutter pub get

# 4. Generate app icons (if needed)
flutter pub run flutter_launcher_icons

# 5. Run on connected device
flutter run

# 6. Build APK
flutter build apk --release

# 7. Build iOS (macOS only)
flutter build ios --release
```

### Important Notes

1. **API Server** — Ensure the backend server is running and accessible at the configured base URL before launching the app
2. **Stripe** — `MainActivity.kt` must extend `FlutterFragmentActivity` for Stripe to work on Android
3. **Google Sign-In** — Requires proper Firebase/Google Cloud configuration with SHA-1/SHA-256 fingerprints
4. **Network** — The app uses local network IP (`192.168.10.64`). Update `api_service.dart` for production deployment
5. **ImgBB** — Image uploads go directly to ImgBB API. The backend `/upload/imgbb` endpoint is not used

---

## Controller Dependency Registration

All controllers are globally registered in `ControllerBinding` and available throughout the app:

```dart
class ControllerBinding extends Bindings {
  @override
  void dependencies() {
    Get.put<AuthController>(AuthController(), permanent: true);
    Get.put<ProfileControllers>(ProfileControllers(), permanent: true);
    Get.put<AddServiceControllers>(AddServiceControllers(), permanent: true);
    Get.put<OrderControllers>(OrderControllers(), permanent: true);
    Get.put<ChatTokenControllers>(ChatTokenControllers(), permanent: true);
  }
}
```

Access from any screen:
```dart
final authCtrl = Get.find<AuthController>();
final profileCtrl = Get.find<ProfileControllers>();
final serviceCtrl = Get.find<AddServiceControllers>();
final orderCtrl = Get.find<OrderControllers>();
final chatCtrl = Get.find<ChatTokenControllers>();
```

---

> **Document generated on:** February 22, 2026  
> **Project:** UltraWash v1.0.0  
> **Repository:** https://github.com/ripannaasmind/mobileApp_ultra_wash

