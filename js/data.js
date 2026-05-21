// đăng nhập đăng ký
$(document).ready(function() {
    
    // Khi click vào chữ "Đăng ký ngay"
    $('#toRegister').click(function(e) {
        e.preventDefault(); // Ngăn trang bị tải lại
        $('#loginCard').hide(); // Ẩn form đăng nhập
        $('#registerCard').fadeIn(); // Hiện form đăng ký với hiệu ứng mượt
    });

    // Khi click vào chữ "Đăng nhập" ở dưới form đăng ký
    $('#toLogin').click(function(e) {
        e.preventDefault();
        $('#registerCard').hide(); // Ẩn form đăng ký
        $('#loginCard').fadeIn(); // Hiện form đăng nhập
    });


});