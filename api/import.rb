
require 'json'

puts("importing catalogue.json...")
catalogue = JSON.parse(File.open("catalogue.json").read)

catalogue.each do |i|
  File.open("tmp.json", "w") {|f| f.write("#{i.to_json}\n")}
  system("curl -s -w '%{http_code}\n' -XPOST 'http://localhost:9000/api/cities' -H 'Content-Type: application/json' --data @tmp.json")
  File.unlink("tmp.json")
end
