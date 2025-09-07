-- Stored function to link payment to user (bypasses RLS)
-- This function runs with SECURITY DEFINER privileges to bypass RLS policies

CREATE OR REPLACE FUNCTION link_payment_to_user(
    p_order_id TEXT,
    p_user_id UUID,
    p_user_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to run with admin privileges
SET search_path = public
AS $$
DECLARE
    v_payment_record RECORD;
    v_result JSON;
BEGIN
    -- Validate inputs
    IF p_order_id IS NULL OR TRIM(p_order_id) = '' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Order ID is required',
            'data', null
        );
    END IF;
    
    IF p_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User ID is required',
            'data', null
        );
    END IF;
    
    IF p_user_email IS NULL OR TRIM(p_user_email) = '' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User email is required',
            'data', null
        );
    END IF;
    
    -- Check if payment exists and is eligible for linking
    SELECT * INTO v_payment_record
    FROM user_payments
    WHERE order_id = p_order_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Payment not found',
            'data', null
        );
    END IF;
    
    -- Check if payment is already linked
    IF v_payment_record.user_id IS NOT NULL THEN
        IF v_payment_record.user_id = p_user_id THEN
            -- Already linked to same user - return success
            RETURN json_build_object(
                'success', true,
                'error', null,
                'data', row_to_json(v_payment_record),
                'message', 'Payment already linked to this user'
            );
        ELSE
            RETURN json_build_object(
                'success', false,
                'error', 'Payment already linked to different user: ' || v_payment_record.user_id,
                'data', null
            );
        END IF;
    END IF;
    
    -- Check if payment is paid and settled
    IF NOT v_payment_record.is_paid THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Payment is not marked as paid',
            'data', null
        );
    END IF;
    
    IF v_payment_record.payment_status != 'settled' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Payment status is not settled: ' || COALESCE(v_payment_record.payment_status, 'null'),
            'data', null
        );
    END IF;
    
    -- Perform the update with SECURITY DEFINER privileges (bypasses RLS)
    UPDATE user_payments
    SET 
        user_id = p_user_id,
        email = p_user_email,
        updated_at = NOW()
    WHERE order_id = p_order_id
      AND user_id IS NULL  -- Safety check
    RETURNING * INTO v_payment_record;
    
    -- Check if update was successful
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to update payment - record may have been modified by another transaction',
            'data', null
        );
    END IF;
    
    -- Return success with updated record
    RETURN json_build_object(
        'success', true,
        'error', null,
        'data', row_to_json(v_payment_record),
        'message', 'Payment successfully linked to user'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error and return failure
        RAISE LOG 'link_payment_to_user error: % %', SQLSTATE, SQLERRM;
        RETURN json_build_object(
            'success', false,
            'error', 'Database error: ' || SQLERRM || ' (Code: ' || SQLSTATE || ')',
            'data', null
        );
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION link_payment_to_user(TEXT, UUID, TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION link_payment_to_user(TEXT, UUID, TEXT) IS 
'Links a payment record to a user account. Runs with SECURITY DEFINER to bypass RLS policies. 
Returns JSON with success flag, error message (if any), and updated payment data.';
