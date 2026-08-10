-- =========================================================
-- SNICT EVENT SYSTEM
-- =========================================================

-- =========================================================
-- EVENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,

    title VARCHAR(255) NOT NULL,

    event_type VARCHAR(100) NOT NULL DEFAULT 'Other',

    description TEXT,

    doctor_name VARCHAR(255),

    specialization VARCHAR(255),

    event_date DATE NOT NULL,

    start_time TIME NOT NULL,

    end_time TIME NOT NULL,

    venue VARCHAR(255),

    event_mode VARCHAR(30) NOT NULL DEFAULT 'offline',

    price NUMERIC(10,2) NOT NULL DEFAULT 0,

    max_slots INTEGER,

    image_url TEXT,

    booking_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    published BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- EVENT BOOKINGS
-- =========================================================

CREATE TABLE IF NOT EXISTS event_bookings (
    id SERIAL PRIMARY KEY,

    booking_code VARCHAR(50) UNIQUE NOT NULL,

    event_id INTEGER NOT NULL
        REFERENCES events(id)
        ON DELETE CASCADE,

    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    amount NUMERIC(10,2) NOT NULL DEFAULT 0,

    booking_status VARCHAR(30) NOT NULL DEFAULT 'payment_pending',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- EVENT PAYMENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS event_payments (
    id SERIAL PRIMARY KEY,

    booking_id INTEGER NOT NULL
        REFERENCES event_bookings(id)
        ON DELETE CASCADE,

    payment_method VARCHAR(30) NOT NULL DEFAULT 'upi',

    transaction_id VARCHAR(255),

    amount NUMERIC(10,2) NOT NULL DEFAULT 0,

    payment_status VARCHAR(30) NOT NULL DEFAULT 'pending',

    payment_proof_url TEXT,

    verified_by INTEGER
        REFERENCES admins(id)
        ON DELETE SET NULL,

    verified_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- EVENT EXPENSES
-- =========================================================

CREATE TABLE IF NOT EXISTS event_expenses (
    id SERIAL PRIMARY KEY,

    event_id INTEGER NOT NULL
        REFERENCES events(id)
        ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,

    category VARCHAR(100),

    amount NUMERIC(10,2) NOT NULL,

    description TEXT,

    proof_url TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_events_date
ON events(event_date);

CREATE INDEX IF NOT EXISTS idx_events_type
ON events(event_type);

CREATE INDEX IF NOT EXISTS idx_events_published
ON events(published);

CREATE INDEX IF NOT EXISTS idx_event_bookings_event
ON event_bookings(event_id);

CREATE INDEX IF NOT EXISTS idx_event_bookings_user
ON event_bookings(user_id);

CREATE INDEX IF NOT EXISTS idx_event_bookings_status
ON event_bookings(booking_status);

CREATE INDEX IF NOT EXISTS idx_event_payments_booking
ON event_payments(booking_id);

CREATE INDEX IF NOT EXISTS idx_event_payments_status
ON event_payments(payment_status);

CREATE INDEX IF NOT EXISTS idx_event_expenses_event
ON event_expenses(event_id);