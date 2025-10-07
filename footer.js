(function() {
    const footerHTML = `
    <footer style="background-color:#F8F8F8; padding:30px 20px; text-align:center; box-shadow:0 -2px 10px rgba(0,0,0,0.05); font-family:'Poppins',sans-serif; width:100vw; margin-top:10px; position:relative; left:0; margin:0;">
        <div style="margin-bottom:15px;">
            <img src="logo.png" alt="GoStarterAI Logo" style="width:50px; height:50px; display:block; margin:0 auto 10px;">
            <p style="font-weight:500; color:#777777; margin:0;">GoStarterAI — Turn ideas into reality.</p>
        </div>
        <div style="font-size:0.9em; color:#555555;">
            <a href="legal/privacy.html" style="margin:0 8px; color:#4A90E2; text-decoration:none;">Privacy</a> ·
            <a href="legal/terms.html" style="margin:0 8px; color:#4A90E2; text-decoration:none;">Terms</a> ·
            <a href="legal/cookies.html" style="margin:0 8px; color:#4A90E2; text-decoration:none;">Cookies</a> ·
            <a href="legal/disclaimer.html" style="margin:0 8px; color:#4A90E2; text-decoration:none;">Disclaimer</a>
        </div>
    </footer>
    `;
    
    const footerContainer = document.getElementById('site-footer');
    if (footerContainer) footerContainer.innerHTML = footerHTML;
})();