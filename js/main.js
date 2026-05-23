// Ép ẩn khung đăng ký ngay khi vừa dựng xong khung HTML để tránh hiển thị chồng chéo
document.addEventListener("DOMContentLoaded", function() {
  const khungDangKy = document.getElementById("khung-dang-ky");
  if (khungDangKy) {
    khungDangKy.style.display = "none";
  }
});

$(document).ready(function() {

  // Lấy dữ liệu phòng trọ dùng chung từ localStorage
  const danhSachPhong = JSON.parse(localStorage.getItem("rooms")) || [];

  // Tự động kiểm tra trạng thái đăng nhập để cập nhật Icon người dùng ở Header
  capNhatTrangThaiHeader();


  // ==================== KHU VỰC 1: XỬ LÝ TRANG CHỦ (index.html) ====================
  if ($('#danh-sach-tro').length > 0) {
    hienThiDanhSachPhong(danhSachPhong.slice(0, 3), '#danh-sach-tro');
  }

  $('#btn-tim').on('click', function() {
    const duongDaChon = $('#chon-duong').val();
    sessionStorage.setItem("duongChuyenTiep", duongDaChon);
    window.location.href = "tim-kiem.html";
  });


  // ==================== KHU VỰC 2: XỬ LÝ TRANG BỘ LỌC TÌM KIẾM (tim-kiem.html) ====================
  if ($('#danh-sach-tim-kiem').length > 0) {
    
    const duongTuTrangChu = sessionStorage.getItem("duongChuyenTiep");
    if (duongTuTrangChu) {
      $('#chon-duong').val(duongTuTrangChu);
      sessionStorage.removeItem("duongChuyenTiep");
    }

    thucHienLocPhong();

    $('#chon-duong, #loc-gia-thap, #loc-gia-cao, #sap-xep').on('change keyup', thucHienLocPhong);
    $('.loc-loai-phong, .loc-tien-ich').on('change', thucHienLocPhong);

    $('#nut-dat-lai').on('click', function() {
      $('#chon-duong').val('all');
      $('#loc-gia-thap').val('0');
      $('#loc-gia-cao').val('10000000');
      $('.loc-loai-phong').prop('checked', false);
      $('.loc-tien-ich').prop('checked', false);
      $('#sap-xep').val('mac-dinh');
      thucHienLocPhong();
    });
  }


  // ==================== KHU VỰC 3: XỬ LÝ TRANG BẢN ĐỒ (ban-do.html) ====================
  if ($('#ban-do-chinh').length > 0) {
    let banDo;
    let danhSachGhim = [];

    banDo = L.map('ban-do-chinh').setView([12.6515, 108.0581], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(banDo);

    function capNhatGhimBanDo(danhSachLoc) {
      danhSachGhim.forEach(ghim => banDo.removeLayer(ghim));
      danhSachGhim = [];

      danhSachLoc.forEach(phong => {
        const ghim = L.marker([phong.lat, phong.lng]).addTo(banDo);
        
        ghim.bindPopup(`
          <div class="popup-ban-do">
            <strong class="popup-ban-do__tieu-de">${phong.title}</strong><br>
            Giá: <span class="popup-ban-do__gia">${phong.price.toLocaleString()}đ</span><br>
            Đường: ${phong.street}
          </div>
        `);

        ghim.on('click', function() {
          hienThiThePhongChon(phong);
        });

        danhSachGhim.push(ghim);
      });

      $('#so-luong-ban-do').text(danhSachLoc.length);
    }

    function hienThiThePhongChon(phong) {
      const theChiTiet = $('#the-phong-chon');
      const noiDung = $('#noi-dung-phong-chon');

      noiDung.html(`
        <div class="the-phong-chon__khung">
          <span class="the-phong-chon__nhan">${phong.tag}</span>
          <h4 class="the-phong-chon__tieu-de">${phong.title}</h4>
          <p class="the-phong-chon__dia-chi">📍 ${phong.address}</p>
          <p class="the-phong-chon__thong-so">📐 Diện tích: <strong>${phong.area} m²</strong></p>
          <div class="the-phong-chon__dong-gia">
            <span>Giá thuê:</span>
            <strong class="the-phong-chon__gia">${phong.price.toLocaleString()}đ/tháng</strong>
          </div>
          <a href="chi-tiet.html?id=${phong.id}" class="the-phong-chon__link">Xem chi tiết</a>
        </div>
      `);

      theChiTiet.fadeIn(200);
    }

    $('#nut-dong-the').on('click', function() {
      $('#the-phong-chon').fadeOut(200);
    });

    function thucHienLocBanDo() {
      const duongLoc = $('#loc-duong-ban-do').val();
      let danhSachSauLoc = danhSachPhong;

      if (duongLoc !== 'all') {
        danhSachSauLoc = danhSachPhong.filter(p => p.street === duongLoc);
      }

      capNhatGhimBanDo(danhSachSauLoc);
      $('#the-phong-chon').fadeOut(100);
    }

    $('#loc-duong-ban-do').on('change', thucHienLocBanDo);
    capNhatGhimBanDo(danhSachPhong);
  }


  // ==================== KHU VỰC 4: XỬ LÝ TRANG ĐĂNG TIN ====================
  if ($('#form-dang-tin').length > 0) {
    
    // Kiểm tra quyền chủ trọ
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
    if (!currentUser || currentUser.role !== 'landlord') {
      alert("Vui lòng đăng nhập tài khoản CHỦ TRỌ để thực hiện chức năng đăng tin!");
      window.location.href = "dang-nhap.html";
      return;
    }

    let hinhAnhBase64 = ""; // Biến chứa chuỗi ảnh bắt buộc

    // Trình đọc ảnh từ thiết bị
    $('#dang-anh').on('change', function() {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          hinhAnhBase64 = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    // Sự kiện nộp Form Đăng tin duy nhất
    $('#form-dang-tin').on('submit', function(e) {
      e.preventDefault();

      // Kiểm tra bắt buộc tải ảnh thực tế lên trước
      if (!hinhAnhBase64) {
        alert("Vui lòng tải lên một hình ảnh thực tế của phòng trọ trước khi Đăng tin!");
        return;
      }

      const tieuDe = $('#dang-tieu-de').val().trim();
      const duong = $('#dang-duong').val();
      const diaChi = $('#dang-dia-chi').val().trim();
      const dienTich = parseInt($('#dang-dien-tich').val());
      const loaiPhong = $('#dang-loai-phong').val();
      const gia = parseInt($('#dang-gia').val());
      const coc = parseInt($('#dang-coc').val());
      const soLuongPhong = $('#dang-so-luong').val().trim();

      const tienIchDaChon = $('.tien-ich-dang:checked').map(function() {
        return $(this).val();
      }).get();

      const offsetLat = (Math.random() - 0.5) * 0.01;
      const offsetLng = (Math.random() - 0.5) * 0.01;
      const latMoi = 12.6515 + offsetLat;
      const lngMoi = 108.0581 + offsetLng;

      const danhSachPhongHienTai = JSON.parse(localStorage.getItem("rooms")) || [];

      const phongTroMoi = {
        id: Date.now(),
        title: tieuDe,
        address: diaChi,
        street: duong,
        price: gia,
        deposit: coc,
        area: dienTich,
        type: loaiPhong,
        rating: 5.0,
        tag: `Còn ${soLuongPhong} phòng`,
        amenities: tienIchDaChon,
        image: hinhAnhBase64, // Lưu chuỗi ảnh thật mã hóa Base64
        lat: latMoi,
        lng: lngMoi,
        landlordId: currentUser.id
      };

      danhSachPhongHienTai.push(phongTroMoi);
      localStorage.setItem("rooms", JSON.stringify(danhSachPhongHienTai));

      alert("Chúc mừng! Bạn đã đăng tin phòng trọ thành công.");
      window.location.href = "tim-kiem.html"; // Chuyển sang trang lọc để xem thành phẩm ngay
    });
  }


  // =========================================================================
  // KHU VỰC 5: XỬ LÝ ĐĂNG NHẬP & ĐĂNG KÝ (dang-nhap.html) 
  // =========================================================================
  if ($('#khung-dang-nhap').length > 0) {
    
    // Đảm bảo ẩn khung Đăng ký khi vừa vào trang
    $('#khung-dang-ky').hide();
    $('#khung-dang-nhap').show();

    // Click chuyển sang form Đăng ký
    $('#link-sang-dang-ky').on('click', function(e) {
      e.preventDefault();
      $('#khung-dang-nhap').hide();
      $('#khung-dang-ky').fadeIn(200);
    });

    // Click chuyển về form Đăng nhập
    $('#link-sang-dang-nhap').on('click', function(e) {
      e.preventDefault();
      $('#khung-dang-ky').hide();
      $('#khung-dang-nhap').fadeIn(200);
    });

    // --- XỬ LÝ ĐĂNG KÝ TÀI KHOẢN MỚI ---
    $('#form-dang-ky-truc-tiep').on('submit', function(e) {
      e.preventDefault();

      const ten = $('#ky-ten').val().trim();
      const email = $('#ky-email').val().trim();
      const soDt = $('#ky-sodt').val().trim();
      const matKhau = $('#ky-mat-khau').val().trim();
      const vaiTro = $('#ky-vai-tro').val();

      // KHỐI BẢO VỆ CHỐNG CRASH: Kiểm tra và đọc dữ liệu localStorage an toàn tuyệt đối
      let danhSachUser = [];
      try {
        const duLieuGoc = localStorage.getItem("users");
        danhSachUser = duLieuGoc ? JSON.parse(duLieuGoc) : [];
        if (!Array.isArray(danhSachUser)) {
          danhSachUser = [];
        }
      } catch (err) {
        danhSachUser = []; // Nếu dữ liệu cũ bị lỗi hỏng, tự động đặt lại mảng rỗng để chống crash
      }

      // Kiểm tra trùng lặp Email
      const checkTrung = danhSachUser.find(u => u.email === email);
      if (checkTrung) {
        alert("Email này đã được sử dụng! Vui lòng chọn email khác.");
        return;
      }

      // Đóng gói lưu trữ tài khoản mới
      const userMoi = {
        id: Date.now(),
        name: ten,
        email: email,
        phone: soDt,
        password: matKhau,
        role: vaiTro
      };

      danhSachUser.push(userMoi);
      localStorage.setItem("users", JSON.stringify(danhSachUser));

      alert("Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.");
      
      // Reset form đăng ký sạch sẽ
      $('#form-dang-ky-truc-tiep')[0].reset();
      
      // SỬA LỖI: Ẩn/Hiện trực tiếp một cách tường minh, không dùng lệnh click mô phỏng ảo nữa
      $('#khung-dang-ky').hide();
      $('#khung-dang-nhap').fadeIn(200);
    });

    // --- XỬ LÝ ĐĂNG NHẬP ---
    $('#form-dang-nhap-truc-tiep').on('submit', function(e) {
      e.preventDefault();

      const email = $('#nhap-email').val().trim();
      const matKhau = $('#nhap-mat-khau').val().trim();

      let danhSachUser = [];
      try {
        const duLieuGoc = localStorage.getItem("users");
        danhSachUser = duLieuGoc ? JSON.parse(duLieuGoc) : [];
        if (!Array.isArray(danhSachUser)) {
          danhSachUser = [];
        }
      } catch (err) {
        danhSachUser = [];
      }

      // Tìm kiếm xem tài khoản khớp thông tin không
      const matchedUser = danhSachUser.find(u => u.email === email && u.password === matKhau);

      if (matchedUser) {
        alert("Đăng nhập thành công!");
        sessionStorage.setItem("currentUser", JSON.stringify(matchedUser));
        window.location.href = "index.html"; // Trở về trang chủ
      } else {
        alert("Sai tài khoản hoặc mật khẩu! Vui lòng thử lại.");
      }
    });
  }
  // ==================== KHU VỰC 6: CÁC HÀM TRỢ GIÚP DÙNG CHUNG ====================

  function thucHienLocPhong() {
    const duongLoc = $('#chon-duong').val();
    const giaThap = parseInt($('#loc-gia-thap').val()) || 0;
    const giaCao = parseInt($('#loc-gia-cao').val()) || 99999999;
    const sapXep = $('#sap-xep').val();

    const loaiPhongDaChon = $('.loc-loai-phong:checked').map(function() {
      return $(this).val();
    }).get();

    const tienIchDaChon = $('.loc-tien-ich:checked').map(function() {
      return $(this).val();
    }).get();

    let danhSachSauLoc = danhSachPhong.filter(phong => {
      if (duongLoc !== 'all' && phong.street !== duongLoc) return false;
      if (phong.price < giaThap || phong.price > giaCao) return false;
      if (loaiPhongDaChon.length > 0 && !loaiPhongDaChon.includes(phong.type)) return false;

      if (tienIchDaChon.length > 0) {
        const checkTienIch = tienIchDaChon.every(ti => phong.amenities.includes(ti));
        if (!checkTienIch) return false;
      }

      return true;
    });

    if (sapXep === 'gia-tang') {
      danhSachSauLoc.sort((a, b) => a.price - b.price);
    } else if (sapXep === 'gia-giam') {
      danhSachSauLoc.sort((a, b) => b.price - a.price);
    }

    hienThiDanhSachPhong(danhSachSauLoc, '#danh-sach-tim-kiem');
    $('#so-luong-phong').text(`Tìm thấy ${danhSachSauLoc.length} phòng trọ`);
  }

  // Thay đổi phương thức hienThiDanhSachPhong trong file js/main.js để xử lý ảnh hiển thị chuyên nghiệp hơn
function hienThiDanhSachPhong(danhSach, idTheChua) {
  const theChua = $(idTheChua);
  theChua.empty();

  if (danhSach.length === 0) {
    theChua.html('<p class="thong-bao-trong">Không tìm thấy phòng trọ nào phù hợp.</p>');
    return;
  }

  danhSach.forEach(phong => {
    // Nếu là link ảnh mockup từ Unsplash hoặc ảnh base64 do người dùng tải lên
    const khungAnhHTML = phong.image 
      ? `<img src="${phong.image}" class="card-phong__anh-that" style="width:100%; height:100%; object-fit:cover;">`
      : `<div class="room-image-placeholder">Ảnh phòng trọ mẫu</div>`;

    const thePhongHTML = `
      <a href="chi-tiet.html?id=${phong.id}" class="card-phong">
        <div class="card-phong__khung-anh" style="position:relative; height:190px; background-color:#cbd5e1; overflow:hidden;">
          <div class="card-phong__nhan">${phong.tag}</div>
          ${khungAnhHTML}
        </div>
        <div class="card-phong__noi-dung">
          <div class="card-phong__dong-dau">
            <h3 class="card-phong__tieu-de">${phong.title}</h3>
            <span class="card-phong__danh-gia">★ ${phong.rating}</span>
          </div>
          <p class="card-phong__dia-chi">📍 ${phong.address}</p>
          <div class="card-phong__thong-so">
            <span>📐 ${phong.area} m²</span>
            <span>🚪 Phòng trọ</span>
          </div>
          <hr class="card-phong__vach-ngan">
          <div class="card-phong__dong-gia">
            <span class="card-phong__nhan-gia">Giá thuê:</span>
            <strong class="card-phong__gia">${phong.price.toLocaleString()}đ</strong>
          </div>
        </div>
      </a>
    `;
    theChua.append(thePhongHTML);
  });
}

  // ==================== KHU VỰC 7: XỬ LÝ TRANG CHI TIẾT PHÒNG TRỌ (chi-tiet.html) ====================
  if ($('#chi-tiet-trang').length > 0) {
    
    function layThamSoIdURL(name) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(name);
    }

    const idPhong = layThamSoIdURL('id');
    const danhSachPhongTuStorage = JSON.parse(localStorage.getItem("rooms")) || [];
    const phongChiTiet = danhSachPhongTuStorage.find(p => String(p.id) === String(idPhong));

    if (!phongChiTiet) {
      alert('Không tìm thấy phòng trọ này! Quay lại trang tìm kiếm.');
      window.location.href = 'tim-kiem.html';
    } else {
      napGiaoDienChiTiet(phongChiTiet);
    }

    function napGiaoDienChiTiet(phong) {
      $('#duong-dan-tieu-de').text(phong.title);
      document.title = `${phong.title} - NhaTroSV`;

      $('#dau-chi-tiet').html(`
        <h1 class="tieu-de-chi-tiet">${phong.title}</h1>
        <div class="thong-tin-phu-chi-tiet">
          <div>📍 ${phong.address}</div>
          <div>🏫 Ea Tam, cách Đại học Tây Nguyên 0.5 km</div>
          <div style="color: #fbbf24;">★ ${phong.rating} (24 đánh giá)</div>
        </div>
        <span class="the-phong-chon__nhan">${phong.tag}</span>
      `);

      // Ưu tiên hiển thị ảnh thật Base64 tải lên nếu có
      const khungAnhTrangChiTietHTML = phong.image 
        ? `<img src="${phong.image}" class="khung-anh-phong-that">`
        : `<div class="room-image-placeholder">Ảnh phòng trọ minh họa</div>`;

      $('#khung-anh-phong').html(khungAnhTrangChiTietHTML);

      $('#luoi-thong-tin-phu').html(`
        <div class="hop-thong-tin-phu">
          <div class="nhan-thong-tin-phu">📐 Diện tích</div>
          <div class="gia-tri-thong-tin-phu">${phong.area} m²</div>
        </div>
        <div class="hop-thong-tin-phu">
          <div class="nhan-thong-tin-phu">🚪 Loại phòng</div>
          <div class="gia-tri-thong-tin-phu">${phong.type === 'single' ? 'Đơn' : phong.type === 'double' ? 'Đôi' : 'KTX'}</div>
        </div>
        <div class="hop-thong-tin-phu">
          <div class="nhan-thong-tin-phu">★ Đánh giá</div>
          <div class="gia-tri-thong-tin-phu">${phong.rating}/5</div>
        </div>
      `);

      const tienDienUocTinh = 3500 * 100; 
      const tongUocTinhThang = phong.price + (phong.deposit / 12) + tienDienUocTinh + 100000 + 100000 + 150000;

      $('#bang-chi-phi').html(`
        <div class="dong-chi-phi">
          <div class="nhan-chi-phi">📅 Tiền thuê hàng tháng</div>
          <div class="gia-tri-chi-phi gia-tri-chi-phi--noi-bat">${phong.price.toLocaleString()}đ</div>
        </div>
        <div class="dong-chi-phi">
          <div class="nhan-chi-phi">📅 Tiền cọc (1 tháng)</div>
          <div class="gia-tri-chi-phi">${phong.deposit.toLocaleString()}đ</div>
        </div>
        <div class="dong-chi-phi">
          <div class="nhan-chi-phi">⚡ Điện (ước tính 100 kWh)</div>
          <div class="gia-tri-chi-phi">${tienDienUocTinh.toLocaleString()}đ</div>
        </div>
        <div class="dong-chi-phi">
          <div class="nhan-chi-phi">💧 Nước định mức</div>
          <div class="gia-tri-chi-phi">100.000đ</div>
        </div>
        <div class="dong-chi-phi">
          <div class="nhan-chi-phi">📶 Wifi tốc độ cao</div>
          <div class="gia-tri-chi-phi">100.000đ</div>
        </div>
        <div class="dong-chi-phi">
          <div class="nhan-chi-phi">🏍️ Gửi xe máy</div>
          <div class="gia-tri-chi-phi">150.000đ</div>
        </div>
        <div class="dong-chi-phi" style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 10px;">
          <div class="nhan-chi-phi" style="font-weight: 700; font-size: 16px;">Tổng ước tính/tháng</div>
          <div class="gia-tri-chi-phi gia-tri-chi-phi--noi-bat" style="font-size: 22px;">${tongUocTinhThang.toLocaleString()}đ</div>
        </div>
      `);

      const checkWifi = phong.amenities.includes('wifi') ? '✔️ Wifi miễn phí' : '❌ Không có Wifi';
      const checkGac = phong.amenities.includes('gac_lung') ? '✔️ Có gác lửng' : '❌ Không gác lửng';
      const checkMayGiat = phong.amenities.includes('may_giat') ? '✔️ Có máy giặt chung' : '❌ Không máy giặt';

      $('#danh-sach-tien-ich').html(`
        <div class="muc-tien-ich">${checkWifi}</div>
        <div class="muc-tien-ich">${checkGac}</div>
        <div class="muc-tien-ich">${checkMayGiat}</div>
        <div class="muc-tien-ich">✔️ Cửa sổ thoáng mát</div>
      `);

      $('#the-lien-he').html(`
        <div class="hop-gia-chinh">
          <div class="gia-chinh">${phong.price.toLocaleString()}đ</div>
          <p>/ tháng</p>
        </div>
        <div class="thong-tin-chu-tro">
          <div class="anh-dai-dien-chu-tro">👤</div>
          <div>
            <div style="font-weight: 700;">Chị Mai (Chủ trọ)</div>
            <div style="font-size: 12px; color: #00c853;">✔️ Đã xác thực thông tin</div>
          </div>
        </div>
        <div class="nhom-nut-lien-he">
          <button class="btn-giao-tiep btn-giao-tiep--phone" onclick="alert('Số điện thoại: 0901234567')">📞 Gọi điện thoại</button>
          <button class="btn-giao-tiep btn-giao-tiep--nhan-tin" onclick="alert('Hộp thư đang được kết nối!')">✉️ Nhắn tin nhanh</button>
          <button class="btn-giao-tiep btn-giao-tiep--dat-lich" onclick="alert('Đã đặt lịch hẹn xem phòng!')">📅 Đặt lịch xem phòng</button>
        </div>
        <div class="hop-luu-y">
          💡 <strong>Lưu ý quan trọng:</strong> Luôn đi xem phòng trực tiếp trước khi giao tiền đặt cọc để tránh bị lừa đảo mạng.
        </div>
      `);

      const mapCon = L.map('ban-do-chi-tiet').setView([phong.lat, phong.lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapCon);
      L.marker([phong.lat, phong.lng]).addTo(mapCon).bindPopup(phong.title);
    }
  }

  function capNhatTrangThaiHeader() {
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
    const vungHanhDong = $('#vung-hanh-dong');

    if (currentUser) {
      let menuHanhDongHTML = '';

      if (currentUser.role === 'landlord') {
        menuHanhDongHTML += `<a href="dang-tin.html" class="btn btn--landlord">Đăng tin trọ</a>`;
      }
      
      menuHanhDongHTML += `
        <div class="user-profile-header">
          <span class="user-avatar-text">👤 ${currentUser.name}</span>
          <button id="nut-dang-xuat" class="btn btn--landlord nut-dang-xuat-header">Đăng xuất</button>
        </div>
      `;

      vungHanhDong.html(menuHanhDongHTML);

      $('#nut-dang-xuat').on('click', function() {
        if (confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
          sessionStorage.removeItem("currentUser");
          window.location.href = "index.html";
        }
      });
    }
  }

});