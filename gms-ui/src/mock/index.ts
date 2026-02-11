import Mock from 'mockjs';

import './user';
import './message-box';
import './mail';

import '@/views/dashboard/workplace/mock';

Mock.setup({
  timeout: '600-1000',
});
