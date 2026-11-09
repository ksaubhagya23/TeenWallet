-- Five short lessons with quizzes. Safe to run more than once (fixed ids + ON CONFLICT).
-- quiz = { "questions": [ { "q": "...", "options": ["a","b","c"], "answerIndex": 0, "explain": "..." } ] }
INSERT INTO lessons (id, title, topic, position, body, quiz) VALUES
('a0000000-0000-0000-0000-000000000001', 'Needs vs wants', 'budgeting', 1,
 'A need is something you must have to live and function: food, a school bag, a phone recharge to reach your family. A want is something nice to have: a new game skin, a third pair of sneakers. Spending on needs first, and wants second, is the first step of every budget.',
 '{"questions":[
   {"q":"Which one is a need?","options":["A new game skin","School lunch","A third pair of sneakers"],"answerIndex":1,"explain":"Lunch keeps you fed and focused. The others are wants."},
   {"q":"If money is short, what do you cut first?","options":["Needs","Wants","Both equally"],"answerIndex":1,"explain":"Wants can wait; needs cannot."},
   {"q":"A phone recharge so you can call home is usually a...","options":["Need","Want","Gift"],"answerIndex":0,"explain":"Staying in touch with family is a need."}]}'),
('a0000000-0000-0000-0000-000000000002', 'The 50/30/20 rule', 'budgeting', 2,
 'Split any money you get into three parts: 50% for needs, 30% for wants, 20% for savings. On Rs 1,000 that is Rs 500 for needs, Rs 300 for wants and Rs 200 saved. You can change the numbers, but always keep something for savings.',
 '{"questions":[
   {"q":"On Rs 1,000, how much goes to savings under 50/30/20?","options":["Rs 100","Rs 200","Rs 300"],"answerIndex":1,"explain":"20% of 1,000 is 200."},
   {"q":"The 30% part is for...","options":["Needs","Wants","Savings"],"answerIndex":1,"explain":"50 needs, 30 wants, 20 savings."},
   {"q":"Is it OK to change the percentages?","options":["Yes, but keep some savings","No, never","Only on weekends"],"answerIndex":0,"explain":"The rule is a guide. Saving something is the key habit."}]}'),
('a0000000-0000-0000-0000-000000000003', 'Why saving works', 'saving', 3,
 'Saving means keeping money today so you can use it later. Small amounts add up: Rs 50 a week is Rs 2,600 in a year. A savings goal, like a pair of headphones, makes it easier because you can see your progress.',
 '{"questions":[
   {"q":"Rs 50 saved every week for a year is about...","options":["Rs 500","Rs 2,600","Rs 26,000"],"answerIndex":1,"explain":"50 x 52 weeks = 2,600."},
   {"q":"What makes saving easier?","options":["Having a clear goal","Hiding your wallet","Spending first"],"answerIndex":0,"explain":"A visible goal keeps you motivated."}]}'),
('a0000000-0000-0000-0000-000000000004', 'Staying safe with online payments', 'safety', 4,
 'Never share your password, OTP or PIN with anyone, even someone who says they are from a bank. Check who you are paying before you confirm. If a deal sounds too good to be true, it usually is. Tell a parent if something feels wrong.',
 '{"questions":[
   {"q":"A caller says they are from your bank and asks for your OTP. You should...","options":["Give it, they are the bank","Refuse and tell a parent","Send it by message"],"answerIndex":1,"explain":"Real banks never ask for your OTP."},
   {"q":"Who should know your PIN?","options":["Your best friend","Nobody but you","Your classmates"],"answerIndex":1,"explain":"A PIN is private."},
   {"q":"An offer of free money if you pay a small fee first is probably...","options":["A great deal","A scam","A bank offer"],"answerIndex":1,"explain":"Paying first to get free money is a classic scam."}]}'),
('a0000000-0000-0000-0000-000000000005', 'Interest: money that grows', 'investing', 5,
 'Interest is a reward for keeping money in a bank. If you save Rs 1,000 at 5% a year, you earn Rs 50 in the first year. Next year you earn interest on Rs 1,050, which is called compounding. The longer you wait, the more it grows.',
 '{"questions":[
   {"q":"Rs 1,000 at 5% a year earns how much in year one?","options":["Rs 5","Rs 50","Rs 500"],"answerIndex":1,"explain":"5% of 1,000 is 50."},
   {"q":"Earning interest on your earlier interest is called...","options":["Compounding","Spending","Budgeting"],"answerIndex":0,"explain":"Compounding makes savings grow faster over time."}]}')
ON CONFLICT (id) DO NOTHING;
