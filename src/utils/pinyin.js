/**
 * 中文姓名转拼音工具
 * 覆盖常用汉字（姓氏 + 名字常用字 + 通用高频字），未收录字符回退到短横线
 */

const PINYIN_MAP = {
  // ===== 常见姓氏 =====
  '赵':'zhao','钱':'qian','孙':'sun','李':'li','周':'zhou','吴':'wu','郑':'zheng','王':'wang',
  '冯':'feng','陈':'chen','褚':'chu','卫':'wei','蒋':'jiang','沈':'shen','韩':'han','杨':'yang',
  '朱':'zhu','秦':'qin','尤':'you','许':'xu','何':'he','吕':'lv','施':'shi','张':'zhang',
  '孔':'kong','曹':'cao','严':'yan','华':'hua','金':'jin','魏':'wei','陶':'tao','姜':'jiang',
  '戚':'qi','谢':'xie','邹':'zou','喻':'yu','柏':'bai','水':'shui','窦':'dou','章':'zhang',
  '云':'yun','苏':'su','潘':'pan','葛':'ge','奚':'xi','范':'fan','彭':'peng','郎':'lang',
  '鲁':'lu','韦':'wei','昌':'chang','马':'ma','苗':'miao','凤':'feng','花':'hua','方':'fang',
  '俞':'yu','任':'ren','袁':'yuan','柳':'liu','酆':'feng','鲍':'bao','史':'shi','唐':'tang',
  '费':'fei','廉':'lian','岑':'cen','薛':'xue','雷':'lei','贺':'he','倪':'ni','汤':'tang',
  '滕':'teng','殷':'yin','罗':'luo','毕':'bi','郝':'hao','邬':'wu','安':'an','常':'chang',
  '乐':'le','于':'yu','时':'shi','傅':'fu','皮':'pi','卞':'bian','齐':'qi','康':'kang',
  '伍':'wu','余':'yu','元':'yuan','卜':'bu','顾':'gu','孟':'meng','平':'ping','黄':'huang',
  '和':'he','穆':'mu','萧':'xiao','尹':'yin','姚':'yao','邵':'shao','湛':'zhan','汪':'wang',
  '祁':'qi','毛':'mao','禹':'yu','狄':'di','米':'mi','贝':'bei','明':'ming','臧':'zang',
  '计':'ji','伏':'fu','成':'cheng','戴':'dai','谈':'tan','宋':'song','茅':'mao','庞':'pang',
  '熊':'xiong','纪':'ji','舒':'shu','屈':'qu','项':'xiang','祝':'zhu','董':'dong','梁':'liang',
  '杜':'du','阮':'ruan','蓝':'lan','闵':'min','席':'xi','季':'ji','麻':'ma','强':'qiang',
  '贾':'jia','路':'lu','娄':'lou','危':'wei','江':'jiang','童':'tong','颜':'yan','郭':'guo',
  '梅':'mei','盛':'sheng','林':'lin','刁':'diao','钟':'zhong','徐':'xu','邱':'qiu','骆':'luo',
  '高':'gao','夏':'xia','蔡':'cai','田':'tian','樊':'fan','胡':'hu','凌':'ling','霍':'huo',
  '虞':'yu','万':'wan','支':'zhi','柯':'ke','昝':'zan','管':'guan','卢':'lu','莫':'mo',
  '经':'jing','房':'fang','裘':'qiu','缪':'miao','干':'gan','解':'xie','应':'ying','宗':'zong',
  '丁':'ding','宣':'xuan','贲':'ben','邓':'deng','郁':'yu','单':'shan','杭':'hang','洪':'hong',
  '包':'bao','诸':'zhu','左':'zuo','石':'shi','崔':'cui','吉':'ji','钮':'niu','龚':'gong',
  '程':'cheng','嵇':'ji','邢':'xing','滑':'hua','裴':'pei','陆':'lu','荣':'rong','翁':'weng',
  '荀':'xun','羊':'yang','惠':'hui','甄':'zhen','曲':'qu','家':'jia','封':'feng','芮':'rui',
  '羿':'yi','储':'chu','靳':'jin','汲':'ji','邴':'bing','糜':'mi','松':'song','井':'jing',
  '段':'duan','富':'fu','巫':'wu','乌':'wu','焦':'jiao','巴':'ba','弓':'gong','牧':'mu',
  '隗':'wei','山':'shai','谷':'gu','车':'che','侯':'hou','宓':'mi','蓬':'peng','全':'quan',
  '郗':'xi','班':'ban','仰':'yang','秋':'qiu','仲':'zhong','伊':'yi','宫':'gong','宁':'ning',
  '仇':'qiu','栾':'luan','暴':'bao','甘':'gan','钭':'tou','厉':'li','戎':'rong','祖':'zu',
  '武':'wu','符':'fu','刘':'liu','景':'jing','詹':'zhan','束':'shu','叶':'ye','幸':'xing',
  '司':'si','韶':'shao','郜':'gao','黎':'li','蓟':'ji','薄':'bo','印':'yin','宿':'su',
  '白':'bai','怀':'huai','蒲':'pu','邰':'tai','从':'cong','鄂':'e','索':'suo','咸':'xian',
  '籍':'ji','赖':'lai','卓':'zhuo','蔺':'lin','屠':'tu','蒙':'meng','池':'chi','乔':'qiao',
  '阴':'yin','郁':'yu','胥':'xu','能':'nai','苍':'cang','双':'shuang','闻':'wen','莘':'shen',
  '党':'dang','翟':'zhai','谭':'tan','贡':'gong','劳':'lao','逄':'pang','姬':'ji','申':'shen',
  '扶':'fu','堵':'du','冉':'ran','宰':'zai','郦':'li','雍':'yong','璩':'qu','桑':'sang',
  '桂':'gui','濮':'pu','牛':'niu','寿':'shou','通':'tong','边':'bian','扈':'hu','燕':'yan',
  '冀':'ji','浦':'pu','尚':'shang','农':'nong','温':'wen','别':'bie','庄':'zhuang','晏':'yan',
  '柴':'chai','瞿':'qu','阎':'yan','充':'chong','慕':'mu','连':'lian','茹':'ru','习':'xi',
  '宦':'huan','艾':'ai','鱼':'yu','容':'rong','向':'xiang','古':'gu','易':'yi','慎':'shen',
  '戈':'ge','廖':'liao','庾':'yu','终':'zhong','暨':'ji','居':'ju','衡':'heng','步':'bu',
  '都':'du','耿':'geng','满':'man','弘':'hong','匡':'kuang','国':'guo','文':'wen','寇':'kou',
  '广':'guang','禄':'lu','阙':'que','东':'dong','欧':'ou','殳':'shu','沃':'wo','利':'li',
  '蔚':'wei','越':'yue','夔':'kui','隆':'long','师':'shi','巩':'gong','厍':'she','聂':'nie',
  '晁':'chao','勾':'gou','敖':'ao','融':'rong','冷':'leng','訾':'zi','辛':'xin','阚':'kan',
  '那':'na','简':'jian','饶':'rao','空':'kong','曾':'zeng','毋':'wu','沙':'sha','乜':'nie',
  '养':'yang','鞠':'ju','须':'xu','丰':'feng','巢':'chao','关':'guan','蒯':'kuai','相':'xiang',
  '查':'zha','后':'hou','荆':'jing','红':'hong','游':'you','竺':'zhu','权':'quan','逯':'lu',
  '盖':'gai','益':'yi','桓':'huan','公':'gong','仉':'zhang','督':'du','晋':'jin','楚':'chu',
  '闫':'yan','法':'fa','汝':'ru','鄢':'yan','涂':'tu','钦':'qin','商':'shang','牟':'mou',
  '佘':'she','佴':'nai','伯':'bo','赏':'shang','墨':'mo','哈':'ha','谯':'qiao','笪':'da',
  '年':'nian','爱':'ai','阳':'yang','佟':'tong','言':'yan','福':'fu','第五':'dowu',

  // ===== 名字常用字（按拼音排序）=====
  // A
  '阿':'a','啊':'a','爱':'ai','艾':'ai','安':'an','岸':'an','昂':'ang','傲':'ao',
  // B
  '八':'ba','白':'bai','百':'bai','柏':'bo','班':'ban','般':'ban','斌':'bin','彬':'bin',
  '冰':'bing','兵':'bing','波':'bo','博':'bo','搏':'bo','伯':'bo','勃':'bo','薄':'bo',
  '不':'bu','步':'bu','部':'bu','才':'cai','彩':'cai','灿':'can','仓':'cang','苍':'cang',
  // C
  '策':'ce','测':'ce','层':'ceng','茶':'cha','差':'cha','产':'chan','昌':'chang','畅':'chang',
  '超':'chao','朝':'chao','车':'che','臣':'chen','晨':'chen','辰':'chen','沉':'chen','陈':'chen',
  '称':'cheng','成':'cheng','诚':'cheng','承':'cheng','程':'cheng','澄':'cheng','城':'cheng',
  '乘':'cheng','池':'chi','驰':'chi','迟':'chi','赤':'chi','翅':'chi','冲':'chong','充':'chong',
  '崇':'chong','初':'chu','楚':'chu','处':'chu','川':'chuan','传':'chuan','春':'chun','纯':'chun',
  '淳':'chun','翠':'cui','村':'cun','存':'cun','措':'cuo',
  // D
  '达':'da','大':'da','丹':'dan','单':'dan','淡':'dan','道':'dao','德':'de','登':'deng',
  '等':'deng','迪':'di','弟':'di','殿':'dian','电':'dian','殿':'dian','调':'diao','鼎':'ding',
  '定':'ding','栋':'dong','东':'dong','冬':'dong','斗':'dou','都':'du','端':'duan','断':'duan',
  '段':'duan','多':'duo','朵':'duo',
  // E
  '恩':'en','尔':'er','儿':'er','二':'er',
  // F
  '发':'fa','帆':'fan','凡':'fan','繁':'fan','飞':'fei','非':'fei','芬':'fen','芳':'fang',
  '菲':'fei','纷':'fen','丰':'feng','峰':'feng','锋':'feng','风':'feng','枫':'feng','凤':'feng',
  '佛':'fo','福':'fu','芙':'fu','浮':'fu','符':'fu','复':'fu','富':'fu','付':'fu',
  // G
  '刚':'gang','钢':'gang','岗':'gang','港':'gang','高':'gao','歌':'ge','戈':'ge','格':'ge',
  '隔':'ge','个':'ge','给':'gei','根':'gen','功':'gong','公':'gong','宫':'gong','恭':'gong',
  '固':'gu','古':'gu','谷':'gu','骨':'gu','国':'guo','光':'guang','广':'guang','贵':'gui',
  '桂':'gui','滚':'gun','过':'guo',
  // H
  '海':'hai','含':'han','涵':'han','寒':'han','翰':'han','瀚':'han','好':'hao','浩':'hao',
  '昊':'hao','皓':'hao','呵':'he','和':'he','河':'he','荷':'he','鹤':'he','赫':'he',
  '恒':'heng','宏':'hong','鸿':'hong','厚':'hou','候':'hou','怀':'huai','欢':'huan','焕':'huan',
  '煌':'huang','皇':'huang','辉':'hui','慧':'hui','惠':'hui','荟':'hui','汇':'hui','会':'hui',
  '昏':'hun','魂':'hun','活':'huo','火':'huo','或':'huo','华':'hua',
  // J
  '基':'ji','吉':'ji','极':'ji','集':'ji','即':'ji','己':'ji','纪':'ji','济':'ji',
  '继':'ji','家':'jia','佳':'jia','嘉':'jia','坚':'jian','建':'jian','健':'jian','剑':'jian',
  '俭':'jian','渐':'jian','鉴':'jian','江':'jiang','将':'jiang','娇':'jiao','骄':'jiao','杰':'jie',
  '洁':'jie','捷':'jie','金':'jin','锦':'jin','进':'jin','晋':'jin','京':'jing','晶':'jing',
  '精':'jing','井':'jing','静':'jing','境':'jing','镜':'jing','军':'jun','君':'jun','俊':'jun',
  '骏':'jun','菊':'ju','举':'ju','巨':'ju','具':'ju','娟':'juan','卷':'juan','决':'jue',
  // K
  '凯':'kai','开':'kai','看':'kan','康':'kang','慷':'kang','科':'ke','克':'ke','可':'ke',
  '坤':'kun','阔':'kuo',
  // L
  '兰':'lan','岚':'lan','蓝':'lan','浪':'lang','朗':'lang','乐':'le','磊':'lei','蕾':'lei',
  '力':'li','历':'li','立':'li','丽':'li','莉':'li','莲':'lian','良':'liang','亮':'liang',
  '梁':'liang','凉':'liang','灵':'ling','玲':'ling','凌':'ling','铃':'ling','龙':'long','隆':'long',
  '楼':'lou','露':'lu','路':'lu','陆':'lu','旅':'lv','绿':'lv','伦':'lun','轮':'lun',
  '落':'luo','洛':'luo','琳':'lin','霖':'lin','伶':'ling','灵':'ling','流':'liu','留':'liu',
  // M
  '满':'man','曼':'man','茂':'mao','美':'mei','猛':'meng','梦':'meng','密':'mi','秘':'mi',
  '民':'min','敏':'min','名':'ming','铭':'ming','鸣':'ming','木':'mu','沐':'mu','慕':'mu',
  // N
  '娜':'na','楠':'nan','男':'nan','宁':'ning','凝':'ning','农':'nong',
  // O
  '欧':'ou',
  // P
  '佩':'pei','鹏':'peng','平':'ping','萍':'ping','坡':'po','普':'pu','浦':'pu',
  // Q
  '琪':'qi','琦':'qi','奇':'qi','启':'qi','琦':'qi','强':'qiang','倩':'qian','倩':'qian',
  '乾':'qian','潜':'qian','前':'qian','钱':'qian','庆':'qing','清':'qing','青':'qing','晴':'qing',
  '情':'qing','丘':'qiu','秋':'qiu','全':'quan','泉':'quan','群':'qun','权':'quan','雀':'que',
  // R
  '然':'ran','冉':'ran','人':'ren','仁':'ren','蓉':'rong','容':'rong','柔':'rou','茹':'ru',
  '瑞':'rui','睿':'rui','若':'ruo',
  // S
  '三':'san','山':'shan','善':'shan','尚':'shang','少':'shao','绍':'shao','社':'she','深':'shen',
  '神':'shen','升':'sheng','生':'sheng','胜':'sheng','圣':'sheng','盛':'sheng','师':'shi',
  '世':'shi','士':'shi','事':'shi','适':'shi','守':'shou','首':'shou','书':'shu','淑':'shu',
  '舒':'shu','树':'shu','双':'shuang','顺':'shun','硕':'shuo','思':'si','斯':'si','松':'song',
  '颂':'song','素':'su','速':'su','珊':'shan','莎':'sha','沙':'sha','帅':'shuai','爽':'shuang',
  '诗':'shi','实':'shi','石':'shi','时':'shi','十':'shi','水':'shui','雪':'xue',
  // T
  '堂':'tang','涛':'tao','桃':'tao','天':'tian','添':'tian','甜':'tian','婷':'ting',
  '挺':'ting','通':'tong','同':'tong','彤':'tong','统':'tong','腾':'teng',
  // W
  '婉':'wan','万':'wan','旺':'wang','威':'wei','伟':'wei','卫':'wei','维':'wei','巍':'wei',
  '薇':'wei','雯':'wen','稳':'wen','梧':'wu','五':'wu','武':'wu','务':'wu','物':'wu',
  // X
  '希':'xi','喜':'xi','霞':'xia','先':'xian','贤':'xian','显':'xian','现':'xian','祥':'xiang',
  '翔':'xiang','湘':'xiang','香':'xiang','晓':'xiao','笑':'xiao','效':'xiao','心':'xin','欣':'xin',
  '新':'xin','鑫':'xin','兴':'xing','星':'xing','行':'xing','雄':'xiong','秀':'xiu','旭':'xu',
  '轩':'xuan','萱':'xuan','旋':'xuan','学':'xue','勋':'xun','寻':'xun','迅':'xun',
  // Y
  '雅':'ya','亚':'ya','娅':'ya','言':'yan','岩':'yan','妍':'yan','艳':'yan','燕':'yan',
  '彦':'yan','炎':'yan','洋':'yang','扬':'yang','阳':'yang','瑶':'yao','烨':'ye','业':'ye',
  '义':'yi','艺':'yi','逸':'yi','益':'yi','毅':'yi','翼':'yi','茵':'yin','音':'yin',
  '银':'yin','英':'ying','莹':'ying','颖':'ying','映':'ying','永':'yong','勇':'yong','优':'you',
  '幽':'you','悠':'you','友':'you','宇':'yu','雨':'yu','语':'yu','玉':'yu','育':'yu','昱':'yu',
  '裕':'yu','园':'yuan','圆':'yuan','源':'yuan','远':'yuan','悦':'yue','越':'yue','月':'yue',
  '韵':'yun','芸':'yun','云':'yun',
  // Z
  '泽':'ze','增':'zeng','展':'zhan','占':'zhan','战':'zhan','昭':'zhao','兆':'zhao','照':'zhao',
  '哲':'zhe','真':'zhen','珍':'zhen','贞':'zhen','振':'zhen','震':'zhen','正':'zheng','政':'zheng',
  '之':'zhi','芝':'zhi','志':'zhi','智':'zhi','中':'zhong','忠':'zhong','众':'zhong',
  '洲':'zhou','州':'zhou','珠':'zhu','竹':'zhu','柱':'zhu','筑':'zhu','壮':'zhuang',
  '子':'zi','梓':'zi','紫':'zi','自':'zi','宗':'zong','总':'zong','祖':'zu','尊':'zun','佐':'zuo',

  // ===== 通用高频字（补充日常和系统用字）=====
  '用':'yong','系':'xi','统':'tong','管':'guan','理':'li','教':'jiao','育':'yu','体':'ti',
  '老':'lao','师':'shi','学':'xue','运':'yun','动':'dong','比':'bi','赛':'sai','绩':'ji',
  '分':'fen','数':'shu','据':'ju','报':'bao','告':'gao','析':'xi','训':'xun','练':'lian',
  '安':'an','排':'pai','间':'jian','地':'di','点':'dian','知':'zhi','评':'ping','价':'jia',
  '反':'fan','馈':'kui','测':'ce','试':'shi','查':'cha','看':'kan','打':'da','做':'zuo',
  '写':'xie','读':'du','听':'ting','说':'shuo','问':'wen','答':'da','想':'xiang','要':'yao',
  '能':'neng','会':'hui','可':'ke','以':'yi','把':'ba','被':'bei','让':'rang','给':'gei',
  '从':'cong','到':'dao','在':'zai','有':'you','是':'shi','的':'de','了':'le','和':'he',
  '这':'zhe','那':'na','里':'li','外':'wai','上':'shang','下':'xia','左':'zuo','右':'you',
  '前':'qian','后':'hou','中':'zhong','内':'nei','大':'da','小':'xiao','多':'duo','少':'shao',
  '长':'chang','短':'duan','高':'gao','低':'di','新':'xin','旧':'jiu','好':'hao','坏':'huai',
  '快':'kuai','慢':'man','早':'zao','晚':'wan','来':'lai','去':'qu','进':'jin','出':'chu',
  '开':'kai','关':'guan','起':'qi','停':'ting','走':'zou','跑':'pao','站':'zhan','坐':'zuo',
  '吃':'chi','喝':'he','穿':'chuan','住':'zhu','行':'xing','飞':'fei','买':'mai','卖':'mai',
  '年':'nian','月':'yue','日':'ri','时':'shi','秒':'miao','刻':'ke','今':'jin','明':'ming',
  '昨':'zuo','每':'mei','第':'di','些':'xie','个':'ge','位':'wei','名':'ming','次':'ci',
  '件':'jian','条':'tiao','张':'zhang','本':'ben','页':'ye','行':'hang','列':'lie','组':'zu',
  '对':'dui','错':'cuo','真':'zhen','假':'jia','空':'kong','满':'man','加':'jia','减':'jian',
  '最':'zui','更':'geng','很':'hen','太':'tai','非':'fei','已':'yi','还':'hai','又':'you',
  '也':'ye','都':'du','就':'jiu','才':'cai','只':'zhi','但':'dan','如':'ru','果':'guo',
  '因':'yin','所':'suo','为':'wei','而':'er','或':'huo','与':'yu','及':'ji','其':'qi',
  '他':'ta','她':'ta','我':'wo','你':'ni','们':'men','什':'shen','么':'me','哪':'na',
  '怎':'zen','为':'wei','吗':'ma','呢':'ne','吧':'ba','啊':'a','呀':'ya','哦':'o',
  '选':'xuan','择':'ze','确':'que','认':'ren','提':'ti','交':'jiao','返':'fan','回':'hui',
  '保':'bao','存':'cun','删':'shan','除':'chu','修':'xiu','改':'gai','增':'zeng','创':'chuang',
  '通':'tong','过':'guo','失':'shi','败':'bai','成':'cheng','功':'gong','请':'qing','求':'qiu',
  '接':'jie','收':'shou','发':'fa','送':'song','载':'zai','装':'zhuang','卸':'xie','启':'qi',
  '图':'tu','片':'pian','像':'xiang','视':'shi','频':'pin','声':'sheng','色':'se','型':'xing',
  '级':'ji','班':'ban','课':'ke','题':'ti','考':'kao','答':'da','案':'an','绩':'ji',
  '录':'lu','登':'deng','注':'zhu','册':'ce','账':'zhang','号':'hao','码':'ma','密':'mi',
  '码':'ma','钥':'yao','锁':'suo','门':'men','窗':'chuang','桌':'zhuo','椅':'yi','床':'chuang',
  '房':'fang','屋':'wu','楼':'lou','层':'ceng','梯':'ti','场':'chang','馆':'guan','园':'yuan',
  '池':'chi','场':'chang','操':'cao','跑':'pao','道':'dao','篮':'lan','球':'qiu','足':'zu',
  '排':'pai','网':'wang','羽':'yu','乒':'ping','乓':'pang','跳':'tiao','投':'tou','掷':'zhi',
  '铅':'qian','标':'biao','枪':'qiang','跨':'kua','栏':'lan','接力':'jieli','仰':'yang','蛙':'wa',
  '蝶':'die','自':'zi','由':'you','操':'cao','舞':'wu','拳':'quan','击':'ji','跤':'jiao',
  '柔':'rou','道':'dao','跆':'tai','拳':'quan','武':'wu','术':'shu','健':'jian','身':'shen',
  '瑜':'yu','伽':'jia','普拉':'pula','提':'ti','伸':'shen','展':'zhan','核':'he','心':'xin',
  '肌':'ji','耐':'nai','力':'li','速':'su','度':'du','反':'fan','应':'ying','协':'xie',
  '调':'diao','平':'ping','衡':'heng','灵':'ling','敏':'min','柔':'rou','韧':'ren','弹':'dan'
}

/**
 * 将中文姓名转为拼音用户名
 * @param {string} name - 中文姓名
 * @returns {string} 拼音用户名（全小写，无空格）
 */
export function nameToPinyin(name) {
  if (!name) return ''

  let result = ''
  for (let i = 0; i < name.length; i++) {
    const ch = name[i]
    if (/[a-zA-Z0-9]/.test(ch)) {
      result += ch.toLowerCase()
    } else if (PINYIN_MAP[ch]) {
      result += PINYIN_MAP[ch]
    } else if (/[\u4e00-\u9fa5]/.test(ch)) {
      // 未收录的中文字符用短横线占位，避免乱码
      result += '_'
    }
    // 非中文非字母数字的字符直接跳过
  }
  // 去掉首尾和连续的下划线
  return result.replace(/_+/g, '_').replace(/^_|_$/g, '') || 'user'
}

/**
 * 生成唯一用户名：拼音 + 后缀防重
 * @param {string} name - 中文姓名
 * @param {string} suffix - 防重后缀（如 staff_id 或序号）
 * @returns {string}
 */
export function generateUsernameFromName(name, suffix = '') {
  const py = nameToPinyin(name)
  if (!py || py === 'user') return suffix || 'user'
  return suffix ? `${py}${suffix}` : py
}
