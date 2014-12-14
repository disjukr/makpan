if (typeof module !== 'undefined')
    module.exports = caragen;

function caragen() {
    return caragen.template(caragen.chooseOne(caragen.character));
}
caragen.chooseOne = function chooseOne(array) {
    return array[Math.floor(Math.random() * array.length)];
};
caragen.template = function template(string) {
    return string.replace(/\{(.+?)\}/g, function (match, type) {
        return caragen.template(caragen.chooseOne(caragen[type]));
    });
};
caragen.character = [
    '{hairStyle} {mankind}',
    '{hairStyle} {job}',
    '{hairStyle} {mankind}',
    '{hairStyle} {job} {mankind}',
    '{hairStyle} {fashion}',
    '{color}머리 {fashion}',
    '{coloredHairStyle} {fashion}',
    '{coloredHairStyle} {job}',
    '{coloredHairStyle} {mankind}',
    '{coloredHairStyle} {job} {mankind}',
    '{color}{fashion} {mankind}',
    '{fashion} {job}',
    '{fashion} {job} {mankind}',
    '{dere} {mankind}',
    '{dere} {job} {mankind}',
    '{dere} {fashion}'
];
caragen.coloredHairStyle = [
    '{color}{hairStyle}'
];
caragen.color = [
    '하얀 ',
    '검정',
    '빨간',
    '주황',
    '노란',
    '갈색',
    '금색',
    '초록',
    '파란',
    '남색',
    '보라'
];
caragen.hairStyle = [
    '단발',
    '장발',
    '곱슬',
    '대머리',
    '댕기머리',
    '레게머리',
    '아프로',
    '모히칸',
    '아호게',
    '보브',
    '상투',
    '샤기컷',
    '히메컷',
    '포니테일',
    '트윈테일'
];
caragen.job = [
    '백수',
    '유치원생',
    '초등학생',
    '중학생',
    '고등학생',
    '대학생',
    '대학원생'
];
caragen.fashion = [
    '피어스',
    '후드집업',
    '청바지'
];
caragen.dere = [
    '얀데레',
    '츤데레'
];
caragen.mankind = [
    '미래인',
    '아기',
    '소년',
    '아빠',
    '아저씨',
    '할아버지',
    '소녀',
    '아가씨',
    '엄마',
    '할머니',
    '조상님',
    '원시인',
    '유령',
    '요괴',
    '외계인'
];
