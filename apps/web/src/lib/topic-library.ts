import type { TopicCategory, TopicVocabularyWord } from './topic-meta';

type TopicGroupKey =
  | 'office'
  | 'business'
  | 'finance'
  | 'travel'
  | 'food'
  | 'education'
  | 'technology'
  | 'health'
  | 'daily'
  | 'animals'
  | 'logistics'
  | 'communication';

type WordSeed = {
  word: string;
  meaning: string;
  type?: string;
};

export type LibraryTopic = {
  id: string;
  title: string;
  englishTitle: string;
  category: TopicCategory;
  categoryLabel: string;
  level: 'A1' | 'A2' | 'B1' | 'B2';
  stageId: string;
  stageName: string;
  stageOrder: number;
  stageType: string;
  description: string;
  context: string;
  vocabulary: TopicVocabularyWord[];
};

type TopicDefinition = {
  title: string;
  englishTitle: string;
  group: TopicGroupKey;
  category: TopicCategory;
  categoryLabel: string;
  level: LibraryTopic['level'];
  stageId: string;
  stageName: string;
  stageOrder: number;
  stageType: string;
  description: string;
};

const sharedCoreWords = parseWords(`
ability|khả năng|noun
able|có thể|adjective
accept|chấp nhận|verb
achieve|đạt được|verb
action|hành động|noun
active|năng động|adjective
add|thêm vào|verb
advice|lời khuyên|noun
agree|đồng ý|verb
answer|câu trả lời|noun
arrive|đến nơi|verb
ask|hỏi|verb
available|có sẵn|adjective
basic|cơ bản|adjective
begin|bắt đầu|verb
benefit|lợi ích|noun
bring|mang đến|verb
build|xây dựng|verb
busy|bận rộn|adjective
careful|cẩn thận|adjective
change|thay đổi|verb
choose|chọn|verb
clear|rõ ràng|adjective
common|phổ biến|adjective
complete|hoàn thành|verb
connect|kết nối|verb
continue|tiếp tục|verb
correct|đúng|adjective
create|tạo ra|verb
daily|hằng ngày|adjective
decide|quyết định|verb
describe|mô tả|verb
different|khác nhau|adjective
difficult|khó|adjective
easy|dễ|adjective
enough|đủ|adjective
example|ví dụ|noun
explain|giải thích|verb
fast|nhanh|adjective
finish|kết thúc|verb
follow|theo dõi/làm theo|verb
important|quan trọng|adjective
improve|cải thiện|verb
include|bao gồm|verb
information|thông tin|noun
interest|sự quan tâm|noun
join|tham gia|verb
keep|giữ|verb
learn|học|verb
listen|nghe|verb
main|chính|adjective
make|làm/tạo|verb
manage|quản lý|verb
need|cần|verb
new|mới|adjective
notice|thông báo/chú ý|noun
offer|đề nghị|verb
open|mở|verb
order|thứ tự/đặt hàng|noun
plan|kế hoạch|noun
practice|luyện tập|verb
prepare|chuẩn bị|verb
problem|vấn đề|noun
quick|nhanh|adjective
read|đọc|verb
ready|sẵn sàng|adjective
reason|lý do|noun
receive|nhận|verb
remember|ghi nhớ|verb
repeat|lặp lại|verb
report|báo cáo|noun
request|yêu cầu|noun
review|ôn lại|verb
right|đúng/phù hợp|adjective
safe|an toàn|adjective
same|giống nhau|adjective
search|tìm kiếm|verb
select|lựa chọn|verb
share|chia sẻ|verb
short|ngắn|adjective
simple|đơn giản|adjective
solve|giải quyết|verb
start|bắt đầu|verb
study|học tập|verb
support|hỗ trợ|verb
talk|nói chuyện|verb
target|mục tiêu|noun
test|kiểm tra|noun
think|suy nghĩ|verb
try|thử|verb
understand|hiểu|verb
use|sử dụng|verb
useful|hữu ích|adjective
wait|chờ|verb
work|làm việc|verb
write|viết|verb
`);

const groupWordPools: Record<TopicGroupKey, WordSeed[]> = {
  office: parseWords(`
agenda|chương trình họp|noun
appointment|cuộc hẹn|noun
assistant|trợ lý|noun
boardroom|phòng họp hội đồng|noun
briefing|buổi họp ngắn|noun
calendar|lịch|noun
chairperson|chủ tọa|noun
colleague|đồng nghiệp|noun
committee|ủy ban|noun
conference|hội nghị|noun
deadline|hạn chót|noun
department|phòng ban|noun
desk|bàn làm việc|noun
document|tài liệu|noun
employee|nhân viên|noun
equipment|thiết bị|noun
extension|số máy nhánh|noun
file|hồ sơ|noun
folder|thư mục|noun
form|biểu mẫu|noun
headquarters|trụ sở chính|noun
interview|phỏng vấn|noun
manager|quản lý|noun
memo|bản ghi nhớ|noun
meeting|cuộc họp|noun
monitor|màn hình|noun
noticeboard|bảng thông báo|noun
office|văn phòng|noun
organize|sắp xếp|verb
paperwork|giấy tờ thủ tục|noun
printer|máy in|noun
procedure|quy trình|noun
projector|máy chiếu|noun
proposal|đề xuất|noun
reception|quầy lễ tân|noun
recruit|tuyển dụng|verb
schedule|lịch trình|noun
secretary|thư ký|noun
staff|nhân sự|noun
supervisor|người giám sát|noun
teamwork|làm việc nhóm|noun
telephone|điện thoại bàn|noun
training|đào tạo|noun
workplace|nơi làm việc|noun
workshop|hội thảo thực hành|noun
`),
  business: parseWords(`
advertise|quảng cáo|verb
agreement|thỏa thuận|noun
brand|thương hiệu|noun
budget|ngân sách|noun
campaign|chiến dịch|noun
client|khách hàng|noun
competitor|đối thủ cạnh tranh|noun
contract|hợp đồng|noun
customer|khách hàng|noun
deal|thỏa thuận giao dịch|noun
discount|giảm giá|noun
distributor|nhà phân phối|noun
estimate|ước tính|noun
feedback|phản hồi|noun
guarantee|bảo đảm|noun
launch|ra mắt|verb
market|thị trường|noun
negotiate|đàm phán|verb
offer|ưu đãi|noun
partner|đối tác|noun
product|sản phẩm|noun
profit|lợi nhuận|noun
purchase|mua hàng|verb
quotation|bảng báo giá|noun
refund|hoàn tiền|noun
retail|bán lẻ|noun
revenue|doanh thu|noun
sale|việc bán hàng|noun
service|dịch vụ|noun
supplier|nhà cung cấp|noun
survey|khảo sát|noun
warranty|bảo hành|noun
wholesale|bán sỉ|noun
`),
  finance: parseWords(`
account|tài khoản|noun
accounting|kế toán|noun
balance|số dư|noun
bank|ngân hàng|noun
bill|hóa đơn|noun
borrow|vay mượn|verb
cash|tiền mặt|noun
charge|khoản phí|noun
credit|tín dụng|noun
currency|tiền tệ|noun
deposit|tiền gửi|noun
expense|chi phí|noun
fee|phí|noun
finance|tài chính|noun
income|thu nhập|noun
insurance|bảo hiểm|noun
interest|lãi suất|noun
invoice|hóa đơn thanh toán|noun
investment|đầu tư|noun
loan|khoản vay|noun
payment|thanh toán|noun
receipt|biên lai|noun
salary|lương|noun
savings|tiền tiết kiệm|noun
tax|thuế|noun
transaction|giao dịch|noun
transfer|chuyển khoản|verb
withdraw|rút tiền|verb
`),
  travel: parseWords(`
accommodation|chỗ ở|noun
airline|hãng hàng không|noun
airport|sân bay|noun
arrival|đến nơi|noun
baggage|hành lý|noun
boarding|lên máy bay|noun
booking|đặt chỗ|noun
bus|xe buýt|noun
cancel|hủy|verb
check-in|làm thủ tục|noun
delay|trì hoãn|noun
departure|khởi hành|noun
destination|điểm đến|noun
fare|giá vé|noun
flight|chuyến bay|noun
gate|cổng lên máy bay|noun
guest|khách|noun
hotel|khách sạn|noun
itinerary|lịch trình du lịch|noun
luggage|hành lý|noun
map|bản đồ|noun
passport|hộ chiếu|noun
platform|sân ga|noun
reservation|đặt phòng/đặt chỗ|noun
route|tuyến đường|noun
station|nhà ga|noun
ticket|vé|noun
tour|chuyến tham quan|noun
train|tàu hỏa|noun
visa|thị thực|noun
`),
  food: parseWords(`
appetizer|món khai vị|noun
bake|nướng bánh|verb
beverage|đồ uống|noun
bill|hóa đơn|noun
breakfast|bữa sáng|noun
cafe|quán cà phê|noun
chef|đầu bếp|noun
cook|nấu ăn|verb
dessert|món tráng miệng|noun
dish|món ăn|noun
drink|đồ uống|noun
flavor|hương vị|noun
fresh|tươi|adjective
ingredient|nguyên liệu|noun
juice|nước ép|noun
kitchen|nhà bếp|noun
meal|bữa ăn|noun
menu|thực đơn|noun
order|gọi món|verb
pepper|hạt tiêu|noun
recipe|công thức nấu ăn|noun
restaurant|nhà hàng|noun
salt|muối|noun
serve|phục vụ|verb
snack|đồ ăn nhẹ|noun
soup|súp|noun
spicy|cay|adjective
table|bàn ăn|noun
taste|nếm/hương vị|noun
waiter|phục vụ nam|noun
`),
  education: parseWords(`
assignment|bài tập được giao|noun
backpack|ba lô|noun
blackboard|bảng đen|noun
classmate|bạn cùng lớp|noun
classroom|lớp học|noun
course|khóa học|noun
dictionary|từ điển|noun
essay|bài luận|noun
exam|kỳ thi|noun
exercise|bài tập|noun
grade|điểm/lớp|noun
homework|bài tập về nhà|noun
lecture|bài giảng|noun
lesson|bài học|noun
library|thư viện|noun
marker|bút lông|noun
notebook|vở ghi|noun
paragraph|đoạn văn|noun
pen|cây bút|noun
pencil|bút chì|noun
presentation|bài thuyết trình|noun
quiz|bài kiểm tra ngắn|noun
result|kết quả|noun
semester|học kỳ|noun
student|học viên|noun
teacher|giáo viên|noun
term|học kỳ/thuật ngữ|noun
timetable|thời khóa biểu|noun
whiteboard|bảng trắng|noun
worksheet|phiếu bài tập|noun
`),
  technology: parseWords(`
application|ứng dụng|noun
backup|sao lưu|noun
battery|pin|noun
browser|trình duyệt|noun
camera|máy ảnh|noun
click|nhấp chuột|verb
cloud|đám mây dữ liệu|noun
computer|máy tính|noun
database|cơ sở dữ liệu|noun
device|thiết bị|noun
download|tải xuống|verb
file|tệp|noun
keyboard|bàn phím|noun
login|đăng nhập|noun
network|mạng|noun
password|mật khẩu|noun
platform|nền tảng|noun
screen|màn hình|noun
software|phần mềm|noun
storage|lưu trữ|noun
system|hệ thống|noun
tablet|máy tính bảng|noun
upload|tải lên|verb
website|trang web|noun
wireless|không dây|adjective
`),
  health: parseWords(`
appointment|lịch hẹn|noun
clinic|phòng khám|noun
cough|ho|noun
doctor|bác sĩ|noun
exercise|tập thể dục|noun
fever|sốt|noun
healthy|khỏe mạnh|adjective
hospital|bệnh viện|noun
medicine|thuốc|noun
nurse|y tá|noun
patient|bệnh nhân|noun
pharmacy|nhà thuốc|noun
rest|nghỉ ngơi|noun
symptom|triệu chứng|noun
treatment|điều trị|noun
vitamin|vitamin|noun
`),
  daily: parseWords(`
apartment|căn hộ|noun
bathroom|phòng tắm|noun
bedroom|phòng ngủ|noun
brush|chải|verb
clean|dọn dẹp|verb
family|gia đình|noun
friend|bạn bè|noun
garden|khu vườn|noun
house|ngôi nhà|noun
kitchen|nhà bếp|noun
laundry|giặt ủi|noun
living room|phòng khách|noun
neighbor|hàng xóm|noun
routine|thói quen|noun
shopping|mua sắm|noun
sleep|ngủ|verb
street|đường phố|noun
wake up|thức dậy|verb
`),
  animals: parseWords(`
animal|động vật|noun
bear|con gấu|noun
bird|con chim|noun
cat|con mèo|noun
dog|con chó|noun
dolphin|cá heo|noun
eagle|đại bàng|noun
elephant|con voi|noun
feather|lông vũ|noun
fish|con cá|noun
forest|khu rừng|noun
fox|con cáo|noun
habitat|môi trường sống|noun
insect|côn trùng|noun
lion|sư tử|noun
monkey|khỉ|noun
penguin|chim cánh cụt|noun
rabbit|con thỏ|noun
shell|mai/vỏ|noun
tiger|hổ|noun
turtle|rùa|noun
wildlife|động vật hoang dã|noun
zoo|sở thú|noun
`),
  logistics: parseWords(`
address|địa chỉ|noun
cargo|hàng hóa|noun
carrier|đơn vị vận chuyển|noun
deliver|giao hàng|verb
delivery|việc giao hàng|noun
inventory|hàng tồn kho|noun
package|gói hàng|noun
parcel|bưu kiện|noun
route|tuyến đường|noun
ship|vận chuyển|verb
shipment|lô hàng|noun
stock|hàng trong kho|noun
supplier|nhà cung cấp|noun
tracking|theo dõi vận đơn|noun
warehouse|kho hàng|noun
`),
  communication: parseWords(`
announcement|thông báo|noun
apology|lời xin lỗi|noun
call|cuộc gọi|noun
chat|trò chuyện|noun
conversation|cuộc hội thoại|noun
email|thư điện tử|noun
greeting|lời chào|noun
message|tin nhắn|noun
question|câu hỏi|noun
reply|phản hồi|noun
request|yêu cầu|noun
response|câu trả lời|noun
suggestion|gợi ý|noun
telephone|điện thoại|noun
voice|giọng nói|noun
`),
};

const topicGroups: Array<{
  stageName: string;
  stageType: string;
  stageOrder: number;
  stageId: string;
  group: TopicGroupKey;
  category: TopicCategory;
  categoryLabel: string;
  level: LibraryTopic['level'];
  titles: string[];
}> = [
  {
    stageName: 'Công sở và giao tiếp nơi làm việc',
    stageType: 'Workplace',
    stageOrder: 1,
    stageId: 'library-stage-workplace',
    group: 'office',
    category: 'ToeicVanPhong',
    categoryLabel: 'Văn phòng',
    level: 'A2',
    titles: [
      'Office routines',
      'Meetings and agendas',
      'Email and memos',
      'Office equipment',
      'Job interviews',
      'Human resources',
      'Training sessions',
      'Teamwork',
      'Work schedules',
      'Project updates',
      'Workplace safety',
      'Company policies',
    ],
  },
  {
    stageName: 'Kinh doanh và dịch vụ khách hàng',
    stageType: 'Business',
    stageOrder: 2,
    stageId: 'library-stage-business',
    group: 'business',
    category: 'ToeicKinhDoanh',
    categoryLabel: 'Kinh doanh',
    level: 'B1',
    titles: [
      'Sales conversations',
      'Customer service',
      'Product launch',
      'Marketing campaign',
      'Business negotiation',
      'Client feedback',
      'Retail stores',
      'Online shopping',
      'Warranty and refunds',
      'Business presentations',
      'Supplier management',
      'Market research',
    ],
  },
  {
    stageName: 'Tài chính, ngân hàng và kế toán',
    stageType: 'Finance',
    stageOrder: 3,
    stageId: 'library-stage-finance',
    group: 'finance',
    category: 'ToeicKinhDoanh',
    categoryLabel: 'Tài chính',
    level: 'B1',
    titles: [
      'Banking services',
      'Invoices and receipts',
      'Budget planning',
      'Accounting basics',
      'Taxes and fees',
      'Insurance',
      'Investment reports',
      'Salary and benefits',
      'Payments and transfers',
      'Business expenses',
      'Price quotations',
      'Financial statements',
    ],
  },
  {
    stageName: 'Du lịch, khách sạn và di chuyển',
    stageType: 'Travel',
    stageOrder: 4,
    stageId: 'library-stage-travel',
    group: 'travel',
    category: 'DuLich',
    categoryLabel: 'Du lịch',
    level: 'A2',
    titles: [
      'Airport check-in',
      'Hotel reservations',
      'Train station',
      'City directions',
      'Business trips',
      'Flight announcements',
      'Car rental',
      'Tourist attractions',
      'Travel problems',
      'Restaurant reservations',
      'Public transportation',
      'Travel documents',
    ],
  },
  {
    stageName: 'Ẩm thực, nhà hàng và mua sắm',
    stageType: 'Food',
    stageOrder: 5,
    stageId: 'library-stage-food',
    group: 'food',
    category: 'DoiSong',
    categoryLabel: 'Đời sống',
    level: 'A1',
    titles: [
      'Breakfast food',
      'Fruit and vegetables',
      'Drinks and desserts',
      'Ordering at a restaurant',
      'Cooking instructions',
      'Grocery shopping',
      'Cafe conversations',
      'Healthy meals',
      'Street food',
      'Kitchen tools',
      'Food delivery',
      'Table manners',
    ],
  },
  {
    stageName: 'Học đường và tự học',
    stageType: 'Education',
    stageOrder: 6,
    stageId: 'library-stage-education',
    group: 'education',
    category: 'HocDuong',
    categoryLabel: 'Học đường',
    level: 'A1',
    titles: [
      'Classroom objects',
      'School subjects',
      'Homework tasks',
      'Exams and results',
      'Library study',
      'Online courses',
      'Presentations',
      'Study habits',
      'Teachers and students',
      'Timetables',
      'Group projects',
      'Vocabulary notebooks',
    ],
  },
  {
    stageName: 'Công nghệ và môi trường số',
    stageType: 'Technology',
    stageOrder: 7,
    stageId: 'library-stage-technology',
    group: 'technology',
    category: 'ToeicVanPhong',
    categoryLabel: 'Công nghệ',
    level: 'B1',
    titles: [
      'Computer basics',
      'Websites and apps',
      'Online meetings',
      'Data and storage',
      'Cybersecurity',
      'Software updates',
      'Mobile devices',
      'Technical support',
      'Digital payments',
      'AI tools',
      'Cloud services',
      'Troubleshooting',
    ],
  },
  {
    stageName: 'Sức khỏe và đời sống cá nhân',
    stageType: 'Health',
    stageOrder: 8,
    stageId: 'library-stage-health',
    group: 'health',
    category: 'DoiSong',
    categoryLabel: 'Sức khỏe',
    level: 'A2',
    titles: [
      'Doctor appointments',
      'Common symptoms',
      'Healthy habits',
      'Exercise routines',
      'Pharmacy',
      'Mental health',
      'Dental care',
      'Hospital services',
      'Nutrition',
      'Emergency situations',
      'Sleep and rest',
      'Fitness goals',
    ],
  },
  {
    stageName: 'Sinh hoạt hằng ngày và gia đình',
    stageType: 'Daily life',
    stageOrder: 9,
    stageId: 'library-stage-daily',
    group: 'daily',
    category: 'DoiSong',
    categoryLabel: 'Đời sống',
    level: 'A1',
    titles: [
      'Morning routines',
      'Family members',
      'House rooms',
      'Daily chores',
      'Shopping errands',
      'Weekend plans',
      'Friends and neighbors',
      'Personal belongings',
      'Home repairs',
      'Weather talk',
      'Hobbies',
      'Daily schedules',
    ],
  },
  {
    stageName: 'Động vật, thiên nhiên và môi trường',
    stageType: 'Nature',
    stageOrder: 10,
    stageId: 'library-stage-nature',
    group: 'animals',
    category: 'DongVat',
    categoryLabel: 'Động vật',
    level: 'A1',
    titles: [
      'Zoo animals',
      'Pets',
      'Farm animals',
      'Sea animals',
      'Birds',
      'Wild animals',
      'Animal body parts',
      'Animal habitats',
      'Weather and nature',
      'Plants and trees',
      'Environmental protection',
      'National parks',
    ],
  },
  {
    stageName: 'Vận hành, logistics và chuỗi cung ứng',
    stageType: 'Logistics',
    stageOrder: 11,
    stageId: 'library-stage-logistics',
    group: 'logistics',
    category: 'ToeicKinhDoanh',
    categoryLabel: 'Logistics',
    level: 'B1',
    titles: [
      'Warehouse operations',
      'Shipping documents',
      'Delivery tracking',
      'Inventory control',
      'Packaging',
      'Factory tours',
      'Product defects',
      'Returns process',
      'Supply chain',
      'Maintenance requests',
      'Quality control',
      'Order fulfillment',
    ],
  },
  {
    stageName: 'Giao tiếp xã hội và tình huống thực tế',
    stageType: 'Communication',
    stageOrder: 12,
    stageId: 'library-stage-communication',
    group: 'communication',
    category: 'DoiSong',
    categoryLabel: 'Giao tiếp',
    level: 'A2',
    titles: [
      'Greetings',
      'Introductions',
      'Phone calls',
      'Making requests',
      'Giving opinions',
      'Apologies',
      'Invitations',
      'Making suggestions',
      'Small talk',
      'Asking for help',
      'Agreeing and disagreeing',
      'Conversation repair',
    ],
  },
];

const topicDefinitions = topicGroups.flatMap((group) =>
  group.titles.map<TopicDefinition>((englishTitle) => ({
    englishTitle,
    title: translateTopicTitle(englishTitle),
    group: group.group,
    category: group.category,
    categoryLabel: group.categoryLabel,
    level: group.level,
    stageId: group.stageId,
    stageName: group.stageName,
    stageOrder: group.stageOrder,
    stageType: group.stageType,
    description: buildDescription(englishTitle, group.stageName),
  })),
);

export const topicLibrary: LibraryTopic[] = topicDefinitions.map((definition, index) => {
  const id = `topic-${slugify(definition.englishTitle)}`;
  return {
    id,
    title: definition.title,
    englishTitle: definition.englishTitle,
    category: definition.category,
    categoryLabel: definition.categoryLabel,
    level: definition.level,
    stageId: definition.stageId,
    stageName: definition.stageName,
    stageOrder: definition.stageOrder,
    stageType: definition.stageType,
    description: definition.description,
    context: `Chủ đề ${definition.englishTitle} giúp học viên học từ vựng theo tình huống thật, có phát âm, ví dụ ngữ cảnh, hình ảnh minh họa và game ôn sau khi học.`,
    vocabulary: buildVocabulary(definition, index),
  };
});

export const topicLibraryStages = topicGroups.map((group) => ({
  id: group.stageId,
  name: group.stageName,
  type: group.stageType,
  orderIndex: group.stageOrder,
  description: `Nhóm chủ đề ${group.stageName.toLowerCase()} được mở tự do để học viên chọn đúng nhu cầu học hiện tại.`,
}));

export function getLibraryTopic(id: string | null | undefined) {
  return topicLibrary.find((topic) => topic.id === id) ?? null;
}

export function isLibraryTopicId(id: string | null | undefined) {
  return Boolean(getLibraryTopic(id));
}

export function getLibraryLessonDetail(id: string | null | undefined) {
  const topic = getLibraryTopic(id);
  if (!topic) return null;

  return {
    id: topic.id,
    title: topic.englishTitle,
    description: topic.description,
    content: topic.context,
    level: topic.level,
    status: 'CongBo',
    passingScore: 80,
    topicName: topic.title,
    stageName: topic.stageName,
    pathName: 'Thư viện chủ đề mở',
    tasks: buildTopicTasks(topic),
    taskProgress: buildTopicTasks(topic).map((task) => ({ ...task, completed: false, completedAt: null })),
    vocabularies: topic.vocabulary.map(normalizeLibraryVocabularyWord),
    grammarPoints: [
      {
        id: `${topic.id}-grammar-context`,
        title: 'Đặt câu theo ngữ cảnh chủ đề',
        structure: 'Chủ ngữ + động từ + từ vựng mục tiêu + chi tiết ngữ cảnh.',
        explanation: 'Sau khi học nghĩa và nghe phát âm, học viên phải tự viết một câu thật có chứa từ đang học.',
        example: topic.vocabulary[0]?.example ?? `The topic is ${topic.englishTitle.toLowerCase()}.`,
        note: 'Câu hợp lệ cần có từ mục tiêu, đủ ý và phù hợp tình huống của chủ đề.',
      },
    ],
    resources: [
      {
        id: `${topic.id}-resource-audio`,
        name: `Audio ${topic.englishTitle}`,
        type: 'Audio',
        url: null,
        description: `Nghe đoạn mô tả ngắn về chủ đề ${topic.englishTitle}.`,
      },
    ],
    quizzes: [],
    progress: null,
    progressPercent: 0,
    stage: {
      stageId: topic.stageId,
      stageName: topic.stageName,
      stageOrder: topic.stageOrder,
    },
  };
}

function normalizeLibraryVocabularyWord(item: TopicVocabularyWord) {
  return {
    id: item.id,
    word: item.word,
    meaning: item.meaning,
    phonetic: item.phonetic ?? null,
    wordType: item.wordType ?? null,
    example: item.example ?? null,
    exampleMeaning: item.exampleMeaning ?? null,
    audioUrl: item.audioUrl ?? null,
    imageUrl: item.imageUrl ?? null,
  };
}

function buildTopicTasks(topic: LibraryTopic) {
  return [
    {
      id: `${topic.id}-task-1`,
      title: 'Học 20 từ trọng tâm đầu tiên',
      instruction: `Nghe phát âm, xem ví dụ và tự đặt câu với 20 từ đầu trong chủ đề ${topic.englishTitle}.`,
      type: 'TuVung',
      required: true,
      orderIndex: 1,
    },
    {
      id: `${topic.id}-task-2`,
      title: 'Học từ theo ngữ cảnh',
      instruction: 'Đọc câu ví dụ, nghe câu mẫu và nói lại ít nhất 10 câu theo chủ đề.',
      type: 'NguCanh',
      required: true,
      orderIndex: 2,
    },
    {
      id: `${topic.id}-task-3`,
      title: 'Chơi game ôn chủ đề',
      instruction: 'Vào Flash Match để ghép từ và nghĩa, mục tiêu đạt ít nhất 80 điểm.',
      type: 'TroChoi',
      required: true,
      orderIndex: 3,
    },
  ];
}

function buildVocabulary(definition: TopicDefinition, topicIndex: number) {
  const titleWords = definition.englishTitle
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z-]/gi, '').toLowerCase())
    .filter((word) => word.length > 2)
    .map<WordSeed>((word) => ({ word, meaning: `từ khóa ${word} trong chủ đề`, type: 'keyword' }));
  const source = uniqueSeeds([...titleWords, ...groupWordPools[definition.group], ...sharedCoreWords]);
  const expanded = [...source];
  let index = 1;
  while (expanded.length < 100) {
    expanded.push({
      word: `${definition.group} expression ${index}`,
      meaning: `cụm diễn đạt ${index} trong nhóm ${definition.categoryLabel.toLowerCase()}`,
      type: 'phrase',
    });
    index += 1;
  }

  return expanded.slice(0, 100).map<TopicVocabularyWord>((seed, wordIndex) => ({
    id: `lib-${topicIndex + 1}-${wordIndex + 1}-${slugify(seed.word)}`,
    word: seed.word,
    meaning: seed.meaning,
    phonetic: null,
    wordType: seed.type ?? 'noun',
    example: buildExample(seed, definition),
    exampleMeaning: buildExampleMeaning(seed, definition),
    audioUrl: null,
    imageUrl: null,
  }));
}

function buildExample(seed: WordSeed, definition: TopicDefinition) {
  const word = seed.word;
  const type = seed.type ?? 'noun';
  const phrase = type.includes('verb') ? word : withArticle(word);

  const exactExamples: Record<string, string> = {
    airport: 'The airport is crowded during the holiday.',
    airline: 'The airline changed my flight time.',
    baggage: 'My baggage is already on the cart.',
    boarding: 'Boarding starts at gate seven.',
    booking: 'I confirmed the booking this morning.',
    destination: 'Our destination is near the beach.',
    flight: 'The flight leaves at 8 p.m.',
    gate: 'Please wait near gate five.',
    hotel: 'The hotel is close to the station.',
    itinerary: 'The itinerary includes a city tour.',
    luggage: 'My luggage is under the seat.',
    passport: 'Show your passport at the counter.',
    reservation: 'I made a reservation for two nights.',
    ticket: 'Keep your ticket until the trip ends.',
    visa: 'She needs a visa for the business trip.',
    agenda: 'The agenda has three main points.',
    appointment: 'I have an appointment with the manager.',
    boardroom: 'The boardroom is ready for the meeting.',
    briefing: 'The briefing starts before lunch.',
    colleague: 'My colleague prepared the report.',
    deadline: 'The deadline is Friday afternoon.',
    document: 'Please attach the document to the email.',
    meeting: 'The meeting begins at nine.',
    printer: 'The printer is next to the desk.',
    training: 'The training starts at nine in the conference room.',
    workshop: 'The workshop helps new staff practice speaking.',
  };

  if (exactExamples[word.toLowerCase()]) return exactExamples[word.toLowerCase()];

  if (definition.group === 'travel') {
    return type.includes('verb')
      ? `Travelers need to ${word} before the trip.`
      : `I need ${phrase} for my trip.`;
  }

  if (definition.group === 'office') {
    return type.includes('verb')
      ? `We need to ${word} before the meeting.`
      : `The team discussed ${phrase} during the meeting.`;
  }

  if (definition.group === 'business') {
    return type.includes('verb')
      ? `The company will ${word} the new product this month.`
      : `The customer asked about ${phrase}.`;
  }

  if (definition.group === 'finance') {
    return type.includes('verb')
      ? `You can ${word} money at the bank.`
      : `The accountant checked ${phrase} carefully.`;
  }

  if (definition.group === 'food') {
    return type.includes('verb')
      ? `The chef will ${word} the meal before noon.`
      : `I would like ${phrase} at the restaurant.`;
  }

  if (definition.group === 'education') {
    return type.includes('verb')
      ? `Students should ${word} during the lesson.`
      : `The teacher used ${phrase} in class.`;
  }

  if (definition.group === 'technology') {
    return type.includes('verb')
      ? `Click the button to ${word} the file.`
      : `The technician checked ${phrase} on the screen.`;
  }

  if (definition.group === 'health') {
    return type.includes('verb')
      ? `Patients should ${word} after the treatment.`
      : `The doctor explained ${phrase} to the patient.`;
  }

  if (definition.group === 'daily') {
    return type.includes('verb')
      ? `I usually ${word} in the morning.`
      : `I see ${phrase} in my daily routine.`;
  }

  if (definition.group === 'animals') {
    return type.includes('verb')
      ? `The animal can ${word} in its habitat.`
      : `Children can see ${phrase} at the zoo.`;
  }

  if (definition.group === 'logistics') {
    return type.includes('verb')
      ? `The driver will ${word} the package today.`
      : `The warehouse team checked ${phrase}.`;
  }

  if (definition.group === 'communication') {
    return type.includes('verb')
      ? `You can ${word} politely in this conversation.`
      : `The speaker gave ${phrase} during the call.`;
  }

  return type.includes('verb') ? `I can ${word} in this situation.` : `This situation includes ${phrase}.`;
}

function buildExampleMeaning(seed: WordSeed, definition: TopicDefinition) {
  const word = seed.word.toLowerCase();
  const meaning = seed.meaning;
  const type = seed.type ?? 'noun';

  const exactMeanings: Record<string, string> = {
    airport: 'Sân bay rất đông trong kỳ nghỉ.',
    airline: 'Hãng hàng không đã thay đổi giờ bay của tôi.',
    baggage: 'Hành lý của tôi đã ở trên xe đẩy.',
    boarding: 'Việc lên máy bay bắt đầu ở cổng số bảy.',
    booking: 'Tôi đã xác nhận đặt chỗ sáng nay.',
    destination: 'Điểm đến của chúng tôi ở gần bãi biển.',
    flight: 'Chuyến bay khởi hành lúc 8 giờ tối.',
    gate: 'Vui lòng chờ gần cổng số năm.',
    hotel: 'Khách sạn ở gần nhà ga.',
    itinerary: 'Lịch trình bao gồm một chuyến tham quan thành phố.',
    luggage: 'Hành lý của tôi ở dưới ghế.',
    passport: 'Hãy xuất trình hộ chiếu tại quầy.',
    reservation: 'Tôi đã đặt chỗ cho hai đêm.',
    ticket: 'Hãy giữ vé của bạn cho đến khi chuyến đi kết thúc.',
    visa: 'Cô ấy cần thị thực cho chuyến công tác.',
    agenda: 'Chương trình họp có ba nội dung chính.',
    appointment: 'Tôi có một cuộc hẹn với quản lý.',
    boardroom: 'Phòng họp hội đồng đã sẵn sàng cho cuộc họp.',
    briefing: 'Buổi họp ngắn bắt đầu trước bữa trưa.',
    colleague: 'Đồng nghiệp của tôi đã chuẩn bị báo cáo.',
    deadline: 'Hạn chót là chiều thứ Sáu.',
    document: 'Vui lòng đính kèm tài liệu vào email.',
    meeting: 'Cuộc họp bắt đầu lúc chín giờ.',
    printer: 'Máy in ở cạnh bàn làm việc.',
    training: 'Buổi đào tạo bắt đầu lúc chín giờ trong phòng hội nghị.',
    workshop: 'Buổi hội thảo thực hành giúp nhân viên mới luyện nói.',
  };

  if (exactMeanings[word]) return exactMeanings[word];

  if (definition.group === 'travel') {
    return type.includes('verb')
      ? `Du khách cần ${meaning} trước chuyến đi.`
      : `Tôi cần ${meaning} cho chuyến đi của mình.`;
  }

  if (definition.group === 'office') {
    return type.includes('verb')
      ? `Chúng ta cần ${meaning} trước cuộc họp.`
      : `Nhóm đã thảo luận về ${meaning} trong cuộc họp.`;
  }

  if (definition.group === 'business') {
    return type.includes('verb')
      ? `Công ty sẽ ${meaning} sản phẩm mới trong tháng này.`
      : `Khách hàng đã hỏi về ${meaning}.`;
  }

  if (definition.group === 'finance') {
    return type.includes('verb')
      ? `Bạn có thể ${meaning} tiền tại ngân hàng.`
      : `Kế toán đã kiểm tra ${meaning} cẩn thận.`;
  }

  if (definition.group === 'food') {
    return type.includes('verb')
      ? `Đầu bếp sẽ ${meaning} món ăn trước buổi trưa.`
      : `Tôi muốn ${meaning} ở nhà hàng.`;
  }

  if (definition.group === 'education') {
    return type.includes('verb')
      ? `Học viên nên ${meaning} trong bài học.`
      : `Giáo viên đã dùng ${meaning} trong lớp.`;
  }

  if (definition.group === 'technology') {
    return type.includes('verb')
      ? `Nhấn nút để ${meaning} tệp.`
      : `Kỹ thuật viên đã kiểm tra ${meaning} trên màn hình.`;
  }

  if (definition.group === 'health') {
    return type.includes('verb')
      ? `Bệnh nhân nên ${meaning} sau khi điều trị.`
      : `Bác sĩ đã giải thích ${meaning} cho bệnh nhân.`;
  }

  if (definition.group === 'daily') {
    return type.includes('verb')
      ? `Tôi thường ${meaning} vào buổi sáng.`
      : `Tôi thấy ${meaning} trong thói quen hằng ngày của mình.`;
  }

  if (definition.group === 'animals') {
    return type.includes('verb')
      ? `Con vật có thể ${meaning} trong môi trường sống của nó.`
      : `Trẻ em có thể thấy ${meaning} ở sở thú.`;
  }

  if (definition.group === 'logistics') {
    return type.includes('verb')
      ? `Tài xế sẽ ${meaning} gói hàng hôm nay.`
      : `Đội kho đã kiểm tra ${meaning}.`;
  }

  if (definition.group === 'communication') {
    return type.includes('verb')
      ? `Bạn có thể ${meaning} một cách lịch sự trong cuộc trò chuyện này.`
      : `Người nói đã đưa ra ${meaning} trong cuộc gọi.`;
  }

  return type.includes('verb')
    ? `Tôi có thể ${meaning} trong tình huống này.`
    : `Tình huống này có ${meaning}.`;
}

function withArticle(word: string) {
  if (/\s/.test(word) || word.endsWith('s')) return word;
  return /^[aeiou]/i.test(word) ? `an ${word}` : `a ${word}`;
}

function parseWords(input: string) {
  return input
    .trim()
    .split('\n')
    .map((line) => {
      const [word, meaning, type] = line.split('|').map((part) => part.trim());
      return { word, meaning, type };
    })
    .filter((item) => item.word && item.meaning);
}

function uniqueSeeds(words: WordSeed[]) {
  const seen = new Set<string>();
  return words.filter((item) => {
    const key = item.word.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildDescription(englishTitle: string, stageName: string) {
  return `Học 100 từ vựng về ${englishTitle} thuộc nhóm ${stageName}, kèm phát âm, ví dụ ngữ cảnh, hình ảnh và game ôn tập.`;
}

function translateTopicTitle(title: string) {
  const dictionary: Record<string, string> = {
    'Office routines': 'Quy trình hằng ngày trong văn phòng',
    'Meetings and agendas': 'Cuộc họp và chương trình họp',
    'Email and memos': 'Email và ghi nhớ nội bộ',
    'Office equipment': 'Thiết bị văn phòng',
    'Job interviews': 'Phỏng vấn việc làm',
    'Human resources': 'Nhân sự',
    'Training sessions': 'Buổi đào tạo',
    Teamwork: 'Làm việc nhóm',
    'Work schedules': 'Lịch làm việc',
    'Project updates': 'Cập nhật dự án',
    'Workplace safety': 'An toàn nơi làm việc',
    'Company policies': 'Chính sách công ty',
    'Sales conversations': 'Hội thoại bán hàng',
    'Customer service': 'Dịch vụ khách hàng',
    'Product launch': 'Ra mắt sản phẩm',
    'Marketing campaign': 'Chiến dịch marketing',
    'Business negotiation': 'Đàm phán kinh doanh',
    'Client feedback': 'Phản hồi khách hàng',
    'Retail stores': 'Cửa hàng bán lẻ',
    'Online shopping': 'Mua sắm trực tuyến',
    'Warranty and refunds': 'Bảo hành và hoàn tiền',
    'Business presentations': 'Thuyết trình kinh doanh',
    'Supplier management': 'Quản lý nhà cung cấp',
    'Market research': 'Nghiên cứu thị trường',
    'Banking services': 'Dịch vụ ngân hàng',
    'Invoices and receipts': 'Hóa đơn và biên lai',
    'Budget planning': 'Lập ngân sách',
    'Accounting basics': 'Kế toán cơ bản',
    'Taxes and fees': 'Thuế và phí',
    Insurance: 'Bảo hiểm',
    'Investment reports': 'Báo cáo đầu tư',
    'Salary and benefits': 'Lương và phúc lợi',
    'Payments and transfers': 'Thanh toán và chuyển khoản',
    'Business expenses': 'Chi phí kinh doanh',
    'Price quotations': 'Bảng báo giá',
    'Financial statements': 'Báo cáo tài chính',
    'Airport check-in': 'Làm thủ tục sân bay',
    'Hotel reservations': 'Đặt phòng khách sạn',
    'Train station': 'Nhà ga tàu hỏa',
    'City directions': 'Chỉ đường trong thành phố',
    'Business trips': 'Chuyến công tác',
    'Flight announcements': 'Thông báo chuyến bay',
    'Car rental': 'Thuê xe',
    'Tourist attractions': 'Địa điểm du lịch',
    'Travel problems': 'Sự cố du lịch',
    'Restaurant reservations': 'Đặt bàn nhà hàng',
    'Public transportation': 'Phương tiện công cộng',
    'Travel documents': 'Giấy tờ du lịch',
    'Breakfast food': 'Món ăn sáng',
    'Fruit and vegetables': 'Trái cây và rau củ',
    'Drinks and desserts': 'Đồ uống và tráng miệng',
    'Ordering at a restaurant': 'Gọi món tại nhà hàng',
    'Cooking instructions': 'Hướng dẫn nấu ăn',
    'Grocery shopping': 'Mua thực phẩm',
    'Cafe conversations': 'Hội thoại ở quán cà phê',
    'Healthy meals': 'Bữa ăn lành mạnh',
    'Street food': 'Ẩm thực đường phố',
    'Kitchen tools': 'Dụng cụ nhà bếp',
    'Food delivery': 'Giao đồ ăn',
    'Table manners': 'Ứng xử trên bàn ăn',
    'Classroom objects': 'Đồ vật lớp học',
    'School subjects': 'Môn học',
    'Homework tasks': 'Bài tập về nhà',
    'Exams and results': 'Kỳ thi và kết quả',
    'Library study': 'Học ở thư viện',
    'Online courses': 'Khóa học trực tuyến',
    Presentations: 'Thuyết trình',
    'Study habits': 'Thói quen học tập',
    'Teachers and students': 'Giáo viên và học viên',
    Timetables: 'Thời khóa biểu',
    'Group projects': 'Dự án nhóm',
    'Vocabulary notebooks': 'Sổ tay từ vựng',
    'Computer basics': 'Máy tính cơ bản',
    'Websites and apps': 'Website và ứng dụng',
    'Online meetings': 'Họp trực tuyến',
    'Data and storage': 'Dữ liệu và lưu trữ',
    Cybersecurity: 'An toàn mạng',
    'Software updates': 'Cập nhật phần mềm',
    'Mobile devices': 'Thiết bị di động',
    'Technical support': 'Hỗ trợ kỹ thuật',
    'Digital payments': 'Thanh toán số',
    'AI tools': 'Công cụ AI',
    'Cloud services': 'Dịch vụ đám mây',
    Troubleshooting: 'Xử lý sự cố',
    'Doctor appointments': 'Lịch hẹn bác sĩ',
    'Common symptoms': 'Triệu chứng thường gặp',
    'Healthy habits': 'Thói quen lành mạnh',
    'Exercise routines': 'Thói quen tập luyện',
    Pharmacy: 'Nhà thuốc',
    'Mental health': 'Sức khỏe tinh thần',
    'Dental care': 'Chăm sóc răng miệng',
    'Hospital services': 'Dịch vụ bệnh viện',
    Nutrition: 'Dinh dưỡng',
    'Emergency situations': 'Tình huống khẩn cấp',
    'Sleep and rest': 'Giấc ngủ và nghỉ ngơi',
    'Fitness goals': 'Mục tiêu thể lực',
    'Morning routines': 'Thói quen buổi sáng',
    'Family members': 'Thành viên gia đình',
    'House rooms': 'Các phòng trong nhà',
    'Daily chores': 'Việc nhà hằng ngày',
    'Shopping errands': 'Việc mua sắm lặt vặt',
    'Weekend plans': 'Kế hoạch cuối tuần',
    'Friends and neighbors': 'Bạn bè và hàng xóm',
    'Personal belongings': 'Đồ dùng cá nhân',
    'Home repairs': 'Sửa chữa trong nhà',
    'Weather talk': 'Nói chuyện về thời tiết',
    Hobbies: 'Sở thích',
    'Daily schedules': 'Lịch sinh hoạt hằng ngày',
    'Zoo animals': 'Động vật sở thú',
    Pets: 'Thú cưng',
    'Farm animals': 'Động vật nông trại',
    'Sea animals': 'Động vật biển',
    Birds: 'Các loài chim',
    'Wild animals': 'Động vật hoang dã',
    'Animal body parts': 'Bộ phận cơ thể động vật',
    'Animal habitats': 'Môi trường sống của động vật',
    'Weather and nature': 'Thời tiết và thiên nhiên',
    'Plants and trees': 'Cây cối',
    'Environmental protection': 'Bảo vệ môi trường',
    'National parks': 'Vườn quốc gia',
    'Warehouse operations': 'Vận hành kho hàng',
    'Shipping documents': 'Chứng từ vận chuyển',
    'Delivery tracking': 'Theo dõi giao hàng',
    'Inventory control': 'Kiểm soát tồn kho',
    Packaging: 'Đóng gói',
    'Factory tours': 'Tham quan nhà máy',
    'Product defects': 'Lỗi sản phẩm',
    'Returns process': 'Quy trình trả hàng',
    'Supply chain': 'Chuỗi cung ứng',
    'Maintenance requests': 'Yêu cầu bảo trì',
    'Quality control': 'Kiểm soát chất lượng',
    'Order fulfillment': 'Hoàn tất đơn hàng',
    Greetings: 'Chào hỏi',
    Introductions: 'Giới thiệu',
    'Phone calls': 'Cuộc gọi điện thoại',
    'Making requests': 'Đưa ra yêu cầu',
    'Giving opinions': 'Nêu ý kiến',
    Apologies: 'Xin lỗi',
    Invitations: 'Lời mời',
    'Making suggestions': 'Đưa ra gợi ý',
    'Small talk': 'Trò chuyện xã giao',
    'Asking for help': 'Nhờ giúp đỡ',
    'Agreeing and disagreeing': 'Đồng ý và không đồng ý',
    'Conversation repair': 'Sửa lỗi trong hội thoại',
  };

  return dictionary[title] ?? title;
}
