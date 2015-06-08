
require 'rmagick'
require 'json'
include Magick

puts("importing catalogue.json...")
catalogue = JSON.parse(File.open("catalogue.json").read)

catalogue.each do |i|
  name = i['name'].gsub(/ /, "_").downcase
  puts("locating picture of #{name}")
  system("curl  #{i['picture']} > cities/#{name}.jpg")
  image = ImageList.new("cities/#{name}.jpg")
  image.resize_to_fill(1440, 880).write "../app/assets/images/#{name}_large.jpg"
  image.resize_to_fill(720, 440).write "../app/assets/images/#{name}_medium.jpg"
  image.resize_to_fill(360, 220).write "../app/assets/images/#{name}_small.jpg"
  puts("importing #{name}")
  i['picture'] = "/assets/images/#{name}_medium.jpg"
  File.open("cities/#{name}.json", "w") {|f| f.write("#{i.to_json}\n")}
  system("curl -s -w '%{http_code}\n' -XPOST 'http://localhost:9000/api/cities' -H 'Content-Type: application/json' --data @cities/#{name}.json")
  puts("end import")
end

puts("end catalogue")
