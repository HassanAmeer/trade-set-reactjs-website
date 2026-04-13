<!DOCTYPE html>
<html>

<head>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            border: 1px solid #eeeeee;
        }

        .header {
            background-color: #0d0d0d;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            color: #00c087;
            margin: 0;
            font-size: 24px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        .content {
            padding: 40px 30px;
            line-height: 1.6;
            color: #333333;
        }

        .footer {
            background-color: #f9f9f9;
            padding: 20px;
            text-align: center;
            font-size: 11px;
            color: #888888;
            border-top: 1px solid #eeeeee;
        }

        .btn {
            display: inline-block;
            padding: 12px 30px;
            background-color: #00c087;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin-top: 20px;
        }

        .otp-box {
            font-size: 28px;
            font-weight: 900;
            letter-spacing: 10px;
            color: #00c087;
            margin: 25px 0;
            text-align: center;
            background: #00c08710;
            padding: 20px;
            border-radius: 10px;
            border: 1px dashed #00c087;
        }

        .data-card {
            background: #f9f9f9;
            border-left: 4px solid #00c087;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }

        .label {
            color: #888;
            font-size: 12px;
            text-transform: uppercase;
            font-weight: bold;
        }

        .value {
            color: #000;
            font-size: 15px;
            font-weight: bold;
            margin-bottom: 10px;
        }
    </style>
</head>

<body>

    <!-- 
    TEMPLATE 1: OTP & SECURITY ONLY
    Purpose: Verification Codes, Login Alerts, Password Resets.
    EmailJS Variables: {{otp_code}} .
-->
    <div style="background:#f4f4f4; padding:20px 0;">
        <div class="container">
            <div class="header">
                <h1>TRADE-SET</h1>
            </div>
            <div class="content" style="text-align: center;">
                <h2 style="margin:0; color:#000;">Verification Required</h2>
                <p> Your OTP Code Is:</p>
                <div class="otp-box">{{otp_code}}</div>
                <p style="font-size: 12px; color: #999;">This code will expire in 10 minutes. If you did not request
                    this, please secure your account immediately.</p>
            </div>
            <div class="footer">Trade-Set &copy; 2026</div>
        </div>
    </div>


  

</body>

</html>