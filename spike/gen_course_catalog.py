# -*- coding: utf-8 -*-
"""扫描 视频教程/ 三套成田课程目录，生成 app/src/data/courseCatalog.js。
课名解析规则按实测文件名：基础课 `N--基础课课程_主题`；中级课 `N_成田电吉他中级进阶课-M：主题`
（以课程序号 M 为准，前缀号仅排序）；核心课 `N--成田电吉他核心课_第X集：MM-主题`。
新增/删除课程文件后重跑本脚本同步目录。"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COURSES_DIR = os.path.join(ROOT, '视频教程')
OUT = os.path.join(ROOT, 'app', 'src', 'data', 'courseCatalog.js')

CN_NUM = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '十一': 11, '十二': 12}


def clean_tail(name):
    return name.replace('.mp4', '').replace('.MP4', '')


def parse_basic():
    lessons = []
    d = os.path.join(COURSES_DIR, '01.基础入门课（73课）')
    for fn in sorted(os.listdir(d)):
        if not fn.lower().endswith('.mp4'):
            continue
        stem = clean_tail(fn)
        m = re.match(r'^(\d+)--(.+)$', stem)
        if not m:
            continue
        no = int(m.group(1))
        body = m.group(2)
        if body.startswith('基础课课程_'):
            title = body.replace('基础课课程_', '').replace('_', '·')
        elif '重点' in body:
            title = '重点！买课后先要看的'
        else:
            title = body.replace('_', '·')
        lessons.append({'key': f'basic-{no:02d}', 'no': str(no), 'title': title, 'filename': fn})
    return sorted(lessons, key=lambda x: int(x['no']))


def parse_intermediate():
    lessons = []
    d = os.path.join(COURSES_DIR, '02.中级进阶课（81课完整版）')
    for fn in sorted(os.listdir(d)):
        if not fn.lower().endswith('.mp4'):
            continue
        stem = clean_tail(fn)
        m = re.match(r'^(\d+)_成田电吉他中级进阶课-(\d+)：(.+)$', stem)
        if m:
            prefix = int(m.group(1))
            no = int(m.group(2))
            title = m.group(3).replace('_', '')
            lessons.append({'key': f'im-{no:02d}-{prefix:02d}', 'no': str(no), 'title': title, 'filename': fn})
            continue
        if '中级课详细介绍' in stem:
            lessons.append({'key': 'im-00', 'no': '0', 'title': '中级课详细介绍（先看）', 'filename': fn})
            continue
        if '买课后先看' in stem:
            lessons.append({'key': 'im-00b', 'no': '0', 'title': '买课后先看这个视频', 'filename': fn})
            continue
        print(f'[中级] 未识别: {fn}', file=sys.stderr)
    return sorted(lessons, key=lambda x: (int(x['no']), x['key']))


def parse_core():
    lessons = []
    d = os.path.join(COURSES_DIR, '03.核心技巧课（40课完整版）')
    for fn in sorted(os.listdir(d)):
        if not fn.lower().endswith('.mp4'):
            continue
        stem = clean_tail(fn)
        if '重点' in stem:
            lessons.append({'key': 'core-00', 'no': '0', 'title': '重点！买课后先要看的', 'filename': fn})
            continue
        m = re.match(r'^\d+--成田电吉他核心课_第(.+)[集课]：(.+)$', stem)
        if m:
            ep = m.group(1)
            title = m.group(2).replace('_', '·')
            lessons.append({'key': f'core-{ep}-{title[:6]}', 'no': ep, 'title': title, 'filename': fn})
            continue
        if '课前练习讲解' in stem:
            lessons.append({'key': 'core-pre', 'no': '课前', 'title': '课前练习讲解', 'filename': fn})
            continue
        print(f'[核心] 未识别: {fn}', file=sys.stderr)
    return sorted(lessons, key=lambda x: (CN_NUM.get(x['no'], 0), x['key']))


def main():
    catalog = [
        {'id': 'basic', 'name': '基础入门课', 'lessons': parse_basic()},
        {'id': 'intermediate', 'name': '中级进阶课', 'lessons': parse_intermediate()},
        {'id': 'core', 'name': '核心技巧课', 'lessons': parse_core()},
    ]
    for c in catalog:
        c['total'] = len(c['lessons'])
    body = json.dumps(catalog, ensure_ascii=False, indent=2)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('// 由 spike/gen_course_catalog.py 扫描 视频教程/ 生成，勿手改；课程文件增删后重跑该脚本同步。\n')
        f.write('export const COURSE_CATALOG = ')
        f.write(body)
        f.write('\n')
    print('written', OUT)
    for c in catalog:
        print(f"  {c['name']}: {c['total']} 课")
        for l in c['lessons'][:3]:
            print(f"     {l['no']}. {l['title']}")


if __name__ == '__main__':
    main()
