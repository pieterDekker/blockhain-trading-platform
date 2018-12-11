from dateutil import parser as dtparser

with open('./node_error', 'r') as fp:
	line = fp.readline()
	line_num = 1
	mined = 0
	reached_canon = 0
	start_time = None
	latest_time = None
	print("reading file line by line")
	while line:
		# print(dtparser.parse(line[12:24]))
		# print("read line {}".format(line_num))
		if (line[:4] == "INFO"):
			if not start_time:
				start_time = dtparser.parse(line[12:24])
			# print("infoline at {}".format(line_num))
			if line.find("mined potential block") >= 0:
				mined += 1
				latest_time = dtparser.parse(line[12:24])
			if line.find("block reached canonical chain") >= 0:
				reached_canon += 1
				latest_time = dtparser.parse(line[12:24])
		line = fp.readline() 
		line_num += 1
	print("{} blocks mined of which {} reached the canonical chain in {}".format(mined, reached_canon, latest_time - start_time))
	print("minerate: {}, propagation rate {}".format((latest_time - start_time)/mined, (latest_time - start_time)/reached_canon))