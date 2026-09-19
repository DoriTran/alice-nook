# Timer Charm: báo cáo triển khai

Ngày: 2026-09-19

## Vấn đề đã xác nhận

Trước bản sửa, Datetime chỉ tạo `deadlineAt` trong `playTimerDecorator`, nhưng giao diện lại ẩn nút Play của mode này. Chọn ngày giờ rồi gửi message chỉ lưu `targetDate`, nên bộ kiểm tra hết hạn không có deadline để theo dõi và chatbox không báo chuông.

## Hành vi sau bản sửa

| Mode | Khi nào bắt đầu | Dữ liệu thời gian | Báo hết hạn |
| --- | --- | --- | --- |
| Countdown | Người dùng bấm Play trên message | `startedAt = now`, `deadlineAt = now + durationMs`; Pause/Reset xóa deadline | Có, khi deadline đến |
| Datetime | Gửi hoặc lưu message | `deadlineAt = targetDate`, không cần Play; sửa ngày giờ rồi lưu sẽ cập nhật deadline | Có với mốc tương lai; mốc đã qua lúc lưu được đánh dấu đã xử lý và không báo |
| Countup | Người dùng bấm Play trên message | `startedAt` để tính thời gian trôi qua; `deadlineAt = null` | Không |

`buildMessagePayload` chuẩn bị deadline Datetime trước khi message được lưu ở Local hoặc gửi API ở Cloud. `scheduleDatetimeDecorator` giữ `alertedAt` nếu lưu lại cùng một mốc, và xóa dấu này khi chọn mốc tương lai mới. Countdown tạo `startedAt` và `deadlineAt` trong `playTimerDecorator`.

Frontend vẫn chịu trách nhiệm canh hạn. `useTimerNotificationCoordinator` quét các message đã tải, đặt timeout tới deadline gần nhất, và kiểm lại khi tab được focus hoặc hiện lại. Khi hết hạn, nó ghi `alertedAt`, dừng timer và chỉ bật `notificationRinging` nếu chatbox đang bật `notificationEnabled`. Nếu notification đang tắt, hạn vẫn được ghi nhận và không báo bù khi bật lại. Trên Cloud, hook chờ POST tạo message hoàn tất trước khi PATCH trạng thái hết hạn; khi PATCH lỗi, nó thử lại sau 5 giây.

Số đếm trên cả ba mode hiện cập nhật bằng đồng hồ cục bộ của component. Việc hiển thị mỗi giây không còn PATCH toàn bộ `decorators` lên API mỗi giây.

## Khôi phục timer bị lỡ trên Cloud

Backend có thêm `POST /api/diary/timers/reconcile`. API dùng session hiện tại, khóa các message có Timer Charm trong transaction, rồi chỉ xử lý Countdown/Datetime có `deadlineAt` hợp lệ đã qua và chưa có `alertedAt`. Response gồm `affectedChatboxIds`, `ringingChatboxIds` và `affectedMessages` với `decorators` mới cùng vị trí/deadline của các timer vừa xử lý. Chatbox tắt notification vẫn được đánh dấu timer đã hết hạn nhưng không nằm trong `ringingChatboxIds`. Request lặp lại không trả thêm timer đã xử lý.

Các đường PATCH/PUT ghi lại `decorators` giữ trạng thái đã báo của cùng timer và cùng deadline, tránh dữ liệu cũ mở lại timer. `GET /api/diary/messages/:id` cho phép một tab lấy riêng message khi tab khác đã xử lý timer sau lúc snapshot được tải.

Frontend gọi reconcile sau khi tải Cloud snapshot và trước khi mở Diary, rồi gọi lại khi tab trở về foreground. Kết quả được merge vào các message liên quan; không refetch toàn bộ Diary. Khi app đang mở, frontend vẫn cho đồng hồ về 0 và bật chuông ngay, sau đó dùng endpoint để xác nhận với backend. Nếu request lỗi, trạng thái Cloud còn chưa xác nhận và sẽ được thử lại; chuông đã phát trong phiên được ghi nhớ để không bật lặp lại. Local Diary không gọi API này.

## File chính

- `src/pages/diary/MessagePanel/DiaryInput/decorator/timer/timer.utils.ts`: quy tắc Play/Pause/Reset và tạo deadline Datetime.
- `src/pages/diary/MessagePanel/DiaryInput/input/composer.utils.ts`: chuẩn bị Datetime khi gửi hoặc lưu message.
- `src/pages/diary/useTimerNotificationCoordinator.ts`: theo dõi hết hạn và bật chuông chatbox.
- `src/pages/diary/MessagePanel/DiaryInput/decorator/timer/useTimerNow.ts`: cập nhật phần hiển thị mỗi giây mà không ghi message.
- `src/pages/diary/MessagePanel/DiaryInput/decorator/timer/TimerMode{Timer,Datetime,Countup}.tsx`: sử dụng đồng hồ hiển thị cục bộ.

## Xác minh và giới hạn

- `npm.cmd run build`: thành công.
- ESLint trên các file đã sửa: thành công.
- `git diff --check`: thành công.
- Backend có test cho điều kiện hết hạn, idempotency, chatbox tắt notification và PATCH cũ. Chưa kiểm thử trực tiếp với PostgreSQL/API thật hoặc trên trình duyệt; các tình huống đóng rồi mở app, POST chậm hoặc lỗi, chuyển nguồn dữ liệu và nhiều tab vẫn cần kiểm thử thủ công.
- Không tự sửa hoặc di chuyển Datetime đã lưu trước bản sửa theo quyết định sẽ xóa dữ liệu cũ. Cloud không có tác vụ hẹn giờ nền hay OS push notification: app phải mở hoặc được mở lại để chạy reconcile. `notificationRinging` trên Cloud vẫn là trạng thái frontend, nên không được đồng bộ giữa các thiết bị.
- Chưa commit hoặc push.
